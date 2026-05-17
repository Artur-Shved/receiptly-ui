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

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json() as { accessToken: string };
        setAccessToken(data.accessToken);
        return request<T>(path, options, true);
      }
    } catch {
      // refresh failed
    }
    setAccessToken(null);
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
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
