import { Capacitor } from '@capacitor/core';
import { supabase } from './lib/supabase';

const AUTH_REQUIRED_MESSAGE = 'Secure link offline. Sign in again to continue.';
const AUTH_EXPIRED_MESSAGE = 'Secure link expired. Sign in again to continue.';
const RATE_LIMIT_MESSAGE = 'Main servers are rate-limiting requests. Please wait a moment and try again.';
const SERVER_UNAVAILABLE_MESSAGE = 'Main servers are temporarily unavailable. Please try again shortly.';
const NETWORK_ERROR_MESSAGE = 'Main servers are unreachable. Check your connection and try again.';
const REQUEST_TIMEOUT_MESSAGE = 'Main servers timed out. Please try again.';
const OAUTH_START_FAILURE_MESSAGE = 'Google sign-in could not be started. Please try again.';
const OAUTH_REDIRECT_FAILURE_MESSAGE = 'Sign-in could not return to this app. Check the allowed Supabase redirect URL and try again.';
const OAUTH_CONSENT_PATH = '/oauth/consent';
const NATIVE_OAUTH_CALLBACK_URL = 'com.ai.assistant://auth/callback';
const AUTH_REDIRECT_ERROR_STORAGE_KEY = 'neo.auth.redirect.error';

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
  const redirectTo = getOAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw new ClientSafeError(getOAuthFailureMessage(error), error.status);
  }

  const authUrl = data?.url;
  if (!authUrl) {
    throw new ClientSafeError(
      'Google sign-in URL is missing. Check the Supabase Google provider and allowed redirect URLs.',
    );
  }

  window.location.assign(authUrl);
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

function getOAuthRedirectUrl() {
  if (Capacitor.isNativePlatform()) {
    return NATIVE_OAUTH_CALLBACK_URL;
  }

  return new URL(OAUTH_CONSENT_PATH, window.location.origin).toString();
}

export async function initializeAuthRedirectHandling() {
  if (!Capacitor.isNativePlatform()) {
    return () => undefined;
  }

  const { App } = await import('@capacitor/app');

  const processAuthUrl = async (callbackUrl?: string) => {
    if (!callbackUrl || !isNativeOAuthCallbackUrl(callbackUrl)) {
      return;
    }

    const errorMessage = await completeNativeOAuthRedirect(callbackUrl);
    if (errorMessage) {
      persistAuthRedirectError(errorMessage);
    } else {
      clearAuthRedirectError();
    }
  };

  const launchUrl = await App.getLaunchUrl();
  await processAuthUrl(launchUrl?.url);

  const listener = await App.addListener('appUrlOpen', ({ url }) => {
    void processAuthUrl(url);
  });

  return () => {
    void listener.remove();
  };
}

function isNativeOAuthCallbackUrl(url: string) {
  return url.startsWith(NATIVE_OAUTH_CALLBACK_URL);
}

async function completeNativeOAuthRedirect(callbackUrl: string) {
  let url: URL;
  try {
    url = new URL(callbackUrl);
  } catch {
    return OAUTH_REDIRECT_FAILURE_MESSAGE;
  }

  const redirectError = getAuthRedirectErrorFromUrl(url);
  if (redirectError) {
    return redirectError;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    return OAUTH_REDIRECT_FAILURE_MESSAGE;
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return getOAuthFailureMessage(error);
  }

  return null;
}

function getOAuthFailureMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return OAUTH_START_FAILURE_MESSAGE;
  }

  const message = error.message.toLowerCase();
  if (message.includes('redirect') || message.includes('callback')) {
    return OAUTH_REDIRECT_FAILURE_MESSAGE;
  }

  return error.message || OAUTH_START_FAILURE_MESSAGE;
}

function clearAuthRedirectParams() {
  const url = new URL(window.location.href);
  const authKeys = ['error', 'error_code', 'error_description', 'error_description_code'];

  authKeys.forEach((key) => {
    url.searchParams.delete(key);
  });

  const hashValue = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (hashValue) {
    const hashParams = new URLSearchParams(hashValue);
    authKeys.forEach((key) => {
      hashParams.delete(key);
    });
    const nextHash = hashParams.toString();
    url.hash = nextHash ? `#${nextHash}` : '';
  }

  window.history.replaceState({}, document.title, url.toString());
}

function persistAuthRedirectError(message: string) {
  window.sessionStorage.setItem(AUTH_REDIRECT_ERROR_STORAGE_KEY, message);
}

function clearAuthRedirectError() {
  window.sessionStorage.removeItem(AUTH_REDIRECT_ERROR_STORAGE_KEY);
}

export function isOAuthConsentPath(pathname = window.location.pathname) {
  return pathname === OAUTH_CONSENT_PATH;
}

export function normalizeOAuthConsentPath() {
  if (!isOAuthConsentPath()) {
    return;
  }

  const url = new URL(window.location.href);
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  window.history.replaceState({}, document.title, url.toString());
}

export function consumeAuthRedirectError() {
  const storedError = window.sessionStorage.getItem(AUTH_REDIRECT_ERROR_STORAGE_KEY);
  if (storedError) {
    clearAuthRedirectError();
    return storedError;
  }

  return getAuthRedirectErrorFromUrl(new URL(window.location.href), true);
}

function getAuthRedirectErrorFromUrl(url: URL, clearAfterRead = false) {
  const searchParams = new URLSearchParams(url.search);
  const hashValue = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hashValue);
  const params = hashParams.has('error') || hashParams.has('error_description') || hashParams.has('error_code')
    ? hashParams
    : searchParams;

  const rawCode = params.get('error_code') ?? '';
  const rawDescription = params.get('error_description') ?? '';
  const rawError = params.get('error') ?? '';

  if (!rawCode && !rawDescription && !rawError) {
    return null;
  }

  if (clearAfterRead) {
    clearAuthRedirectParams();
  }

  const combined = `${rawCode} ${rawError} ${rawDescription}`.toLowerCase();
  if (combined.includes('access_denied')) {
    return 'Google sign-in was canceled or denied.';
  }

  if (combined.includes('redirect') || combined.includes('callback')) {
    return OAUTH_REDIRECT_FAILURE_MESSAGE;
  }

  return rawDescription || rawError || 'Google sign-in failed. Please try again.';
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
