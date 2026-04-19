import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from './lib/supabase';

const AUTH_REQUIRED_MESSAGE = 'Secure link offline. Sign in again to continue.';
const AUTH_EXPIRED_MESSAGE = 'Secure link expired. Sign in again to continue.';
const RATE_LIMIT_MESSAGE = 'Main servers are rate-limiting requests. Please wait a moment and try again.';
const SERVER_UNAVAILABLE_MESSAGE = 'Main servers are temporarily unavailable. Please try again shortly.';
const NETWORK_ERROR_MESSAGE = 'Main servers are unreachable. Check your connection and try again.';
const REQUEST_TIMEOUT_MESSAGE = 'Main servers timed out. Please try again.';
const AUTH_CALLBACK_SCHEME = 'com.ai.assistant';
const AUTH_CALLBACK_HOST = 'auth';
const AUTH_CALLBACK_PATH = '/callback';
const MOBILE_AUTH_REDIRECT_URL = `${AUTH_CALLBACK_SCHEME}://${AUTH_CALLBACK_HOST}${AUTH_CALLBACK_PATH}`;
const OAUTH_START_ERROR_MESSAGE = 'Google sign-in could not start. Try again.';
const OAUTH_CALLBACK_ERROR_MESSAGE = 'Google sign-in did not complete. Try again.';

type AuthUser = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];

let currentUser: AuthUser | null = null;

void supabase.auth.getSession().then(({ data }) => {
  currentUser = data.session?.user ?? null;
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
});

export const auth = {
  get currentUser() {
    return currentUser;
  },
};

export class ClientSafeError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ClientSafeError';
    this.status = status;
  }
}

export const loginWithGoogle = async () => {
  const redirectTo = Capacitor.isNativePlatform()
    ? MOBILE_AUTH_REDIRECT_URL
    : window.location.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Capacitor.isNativePlatform(),
    },
  });

  if (error) {
    throw new ClientSafeError(OAUTH_START_ERROR_MESSAGE);
  }

  if (Capacitor.isNativePlatform()) {
    if (!data?.url) {
      throw new ClientSafeError(OAUTH_START_ERROR_MESSAGE);
    }

    await Browser.open({ url: data.url });
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error signing out', error);
  }
};

export async function initializeMobileAuth(onAuthError: (message: string | null) => void) {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const handledCallbackUrls = new Set<string>();

  const processCallbackUrl = async (url: string) => {
    if (!isAuthCallbackUrl(url)) {
      return;
    }

    if (handledCallbackUrls.has(url)) {
      return;
    }

    handledCallbackUrls.add(url);

    try {
      await restoreSessionFromUrl(url);
      onAuthError(null);

      try {
        await Browser.close();
      } catch {
        // Browser close can fail after a successful deep-link return on some devices.
        // This is non-fatal and should not surface as an auth error.
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Mobile auth callback failed:', error);
      }
      onAuthError(getClientSafeMessage(error, OAUTH_CALLBACK_ERROR_MESSAGE));
    }
  };

  const listener = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    void processCallbackUrl(url);
  });

  const launchUrl = await CapacitorApp.getLaunchUrl();
  if (launchUrl?.url) {
    await processCallbackUrl(launchUrl.url);
  }

  return () => {
    void listener.remove();
  };
}

async function getCurrentSession(forceRefresh = false) {
  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      throw error;
    }
    return data.session;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function getProtectedIdToken(forceRefresh = false) {
  const session = await getCurrentSession(forceRefresh).catch((error) => {
    if (import.meta.env.DEV) {
      console.error('Protected token refresh failed:', error);
    }
    throw new ClientSafeError(AUTH_EXPIRED_MESSAGE, 401);
  });

  if (!session?.access_token) {
    throw new ClientSafeError(AUTH_REQUIRED_MESSAGE, 401);
  }

  currentUser = session.user ?? null;
  return session.access_token;
}

export function getClientSafeMessage(error: unknown, fallbackMessage = 'Operation failed. Please try again.') {
  if (error instanceof ClientSafeError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

interface ProtectedJsonOptions {
  timeoutMs?: number;
  retryOnAuthFailure?: boolean;
}

export async function fetchProtectedJson<T>(input: RequestInfo | URL, init: RequestInit = {}, options: ProtectedJsonOptions = {}): Promise<T> {
  const { timeoutMs = 60000, retryOnAuthFailure = true } = options;

  const execute = async (forceRefresh: boolean): Promise<T> => {
    const idToken = await getProtectedIdToken(forceRefresh);
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${idToken}`);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(input, {
        ...init,
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      window.clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ClientSafeError(REQUEST_TIMEOUT_MESSAGE, 408);
      }
      throw new ClientSafeError(NETWORK_ERROR_MESSAGE);
    }

    window.clearTimeout(timeoutId);

    const rawBody = await response.text();
    let data: unknown = null;
    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        data = rawBody;
      }
    }

    if (response.status === 401 && retryOnAuthFailure && !forceRefresh && auth.currentUser) {
      return execute(true);
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new ClientSafeError(AUTH_EXPIRED_MESSAGE, 401);
      }
      if (response.status === 429) {
        throw new ClientSafeError(RATE_LIMIT_MESSAGE, 429);
      }
      if (response.status >= 500) {
        throw new ClientSafeError(SERVER_UNAVAILABLE_MESSAGE, response.status);
      }

      const serverMessage =
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as { error: unknown }).error === 'string'
          ? (data as { error: string }).error
          : fallbackMessageForStatus(response.status);

      throw new ClientSafeError(serverMessage, response.status);
    }

    return data as T;
  };

  return execute(false);
}

function fallbackMessageForStatus(status: number) {
  if (status >= 400 && status < 500) {
    return 'Request rejected by the secure gateway. Please adjust your input and try again.';
  }

  return SERVER_UNAVAILABLE_MESSAGE;
}

function isAuthCallbackUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const callbackPath = parsedUrl.pathname.endsWith('/')
      ? parsedUrl.pathname.slice(0, -1)
      : parsedUrl.pathname;

    return (
      parsedUrl.protocol.toLowerCase() === `${AUTH_CALLBACK_SCHEME}:` &&
      parsedUrl.host.toLowerCase() === AUTH_CALLBACK_HOST &&
      callbackPath === AUTH_CALLBACK_PATH
    );
  } catch {
    return false;
  }
}

async function restoreSessionFromUrl(url: string) {
  const params = extractAuthParams(url);
  const callbackError = params.get('error_description') ?? params.get('error') ?? params.get('error_code');
  if (callbackError) {
    throw new ClientSafeError(safeDecodeUriComponent(callbackError));
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw new ClientSafeError(OAUTH_CALLBACK_ERROR_MESSAGE);
    }

    return;
  }

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw new ClientSafeError(OAUTH_CALLBACK_ERROR_MESSAGE);
    }
    return;
  }

  throw new ClientSafeError(OAUTH_CALLBACK_ERROR_MESSAGE);
}

function safeDecodeUriComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractAuthParams(url: string) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const hashParams = new URLSearchParams(parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash);

  hashParams.forEach((value, key) => {
    if (!params.has(key)) {
      params.set(key, value);
    }
  });

  return params;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DataAccessErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: Array<{
      providerId: string;
      displayName?: string | null;
      email?: string | null;
      photoUrl?: string | null;
    }>;
  };
}

export function handleDatabaseAccessError(error: unknown, operationType: OperationType, path: string | null) {
  const user = auth.currentUser;
  const errInfo: DataAccessErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.id,
      email: user?.email ?? null,
      emailVerified: !!user?.email_confirmed_at,
      isAnonymous: user?.is_anonymous ?? false,
      tenantId: null,
      providerInfo: (user?.identities ?? []).map((provider) => ({
        providerId: provider.provider || 'unknown',
        displayName: (provider.identity_data?.full_name as string | undefined) ?? null,
        email: (provider.identity_data?.email as string | undefined) ?? null,
        photoUrl: (provider.identity_data?.avatar_url as string | undefined) ?? null,
      })),
    },
    operationType,
    path,
  };

  if (import.meta.env.DEV) {
    console.error('Detailed data access error: ', JSON.stringify(errInfo, null, 2));
  }

  const baseMessage = error instanceof Error ? error.message : String(error);
  if (baseMessage.includes('Missing or insufficient permissions')) {
    throw new Error(`Permission denied while trying to ${operationType} data at ${path || 'unknown path'}.`);
  }
  throw new Error(`Database error during ${operationType} operation. Please try again.`);
}
