import { supabase } from './supabase';

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
  const redirectTo = window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out', error);
    throw error;
  }
};

export async function getProtectedAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new ClientSafeError(AUTH_REQUIRED_MESSAGE, 401);
  }
  return data.session.access_token;
}

export function getClientSafeMessage(error: unknown, fallbackMessage = 'Operation failed. Please try again.') {
  if (error instanceof ClientSafeError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallbackMessage;
}

export async function fetchProtectedJson<T>(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 60000): Promise<T> {
  const accessToken = await getProtectedAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(input, { ...init, headers, signal: controller.signal });
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
    try { data = JSON.parse(rawBody); } catch { data = rawBody; }
  }

  if (!response.ok) {
    if (response.status === 401) throw new ClientSafeError(AUTH_EXPIRED_MESSAGE, 401);
    if (response.status === 429) throw new ClientSafeError(RATE_LIMIT_MESSAGE, 429);
    if (response.status >= 500) throw new ClientSafeError(SERVER_UNAVAILABLE_MESSAGE, response.status);

    const serverMessage = typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error: unknown }).error === 'string'
      ? (data as { error: string }).error
      : fallbackMessageForStatus(response.status);

    throw new ClientSafeError(serverMessage, response.status);
  }

  return data as T;
}

function fallbackMessageForStatus(status: number) {
  if (status >= 400 && status < 500) return 'Request rejected by the secure gateway. Please adjust your input and try again.';
  return SERVER_UNAVAILABLE_MESSAGE;
}
