import { ApiError } from '@/src/types/api.types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

const AUTH_PATHS = [
  '/welcome',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return;
  window.location.href = '/login';
}

// Refresh tokens are single-use (rotated server-side on every /auth/refresh
// call), so concurrent 401s must share ONE in-flight refresh instead of each
// racing its own — the loser would present an already-deleted token and get
// bounced to /login even though the session is fine. This is populated on
// the first 401 and cleared once the refresh settles, so every caller that
// hits 401 while it's in flight awaits the same promise.
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (refreshRes) => {
        if (!refreshRes.ok) return null;
        const data = (await refreshRes.json()) as { accessToken: string };
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !isRetry && path !== '/auth/login' && path !== '/auth/refresh') {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      setAccessToken(newAccessToken);
      return request<T>(path, options, true);
    }
    setAccessToken(null);
    redirectToLogin();
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    let message = 'Request failed';
    let data: unknown;
    try {
      data = await res.json();
      const msg = (data as { message?: string | string[] })?.message;
      if (typeof msg === 'string') message = msg;
      else if (Array.isArray(msg)) message = msg.join(', ');
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message, data);
  }

  const contentLength = res.headers.get('content-length');
  if (res.status === 204 || contentLength === '0') return {} as T;

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: FormData | unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
