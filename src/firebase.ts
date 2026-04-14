import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const AUTH_REQUIRED_MESSAGE = 'Secure link offline. Sign in again to continue.';
const AUTH_EXPIRED_MESSAGE = 'Secure link expired. Sign in again to continue.';
const RATE_LIMIT_MESSAGE = 'Main servers are rate-limiting requests. Please wait a moment and try again.';
const SERVER_UNAVAILABLE_MESSAGE = 'Main servers are temporarily unavailable. Please try again shortly.';
const NETWORK_ERROR_MESSAGE = 'Main servers are unreachable. Check your connection and try again.';
const REQUEST_TIMEOUT_MESSAGE = 'Main servers timed out. Please try again.';

export class ClientSafeError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ClientSafeError';
    this.status = status;
  }
}

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error("Error signing in with Google", error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export async function getProtectedIdToken(forceRefresh = false) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new ClientSafeError(AUTH_REQUIRED_MESSAGE, 401);
  }

  try {
    return await currentUser.getIdToken(forceRefresh);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Protected token refresh failed:', error);
    }
    throw new ClientSafeError(AUTH_EXPIRED_MESSAGE, 401);
  }
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

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: any[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  if (import.meta.env.DEV) {
    console.error('Detailed Firestore Error: ', JSON.stringify(errInfo, null, 2));
  }
  
  // Surface cleaner app-facing errors
  const baseMessage = error instanceof Error ? error.message : String(error);
  if (baseMessage.includes('Missing or insufficient permissions')) {
    throw new Error(`Permission denied while trying to ${operationType} data at ${path || 'unknown path'}.`);
  }
  throw new Error(`Database error during ${operationType} operation. Please try again.`);
}
