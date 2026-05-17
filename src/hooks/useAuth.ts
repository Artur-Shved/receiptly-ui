'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/src/api/auth.api';
import { setAccessToken } from '@/src/api/client';
import { ApiError } from '@/src/types/api.types';
import type { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '@/src/types/auth.types';

/**
 * Hook for user registration.
 *
 * @returns register function, loading state, error message, and error setter
 */
export function useRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (dto: RegisterDto) => {
      setIsLoading(true);
      setError(null);
      try {
        const { accessToken } = await authApi.register(dto);
        setAccessToken(accessToken);
        router.push('/home');
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Помилка з'єднання. Спробуйте ще раз";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return { register, isLoading, error, setError };
}

const LOGIN_LOCKOUT_MS = 30_000;
const LOGIN_MAX_ATTEMPTS = 3;

/**
 * Hook for user login with client-side rate limiting.
 * After 3 failed attempts, login is blocked for 30 seconds.
 *
 * @returns login function, loading state, error, attempt count, lock state, lock expiry
 */
export function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const login = useCallback(
    async (dto: LoginDto) => {
      if (isLocked) return;
      setIsLoading(true);
      setError(null);
      try {
        const { accessToken } = await authApi.login(dto);
        setAccessToken(accessToken);
        setAttempts(0);
        setLockedUntil(null);
        router.push('/home');
      } catch (err) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= LOGIN_MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOGIN_LOCKOUT_MS);
        }
        const message =
          err instanceof ApiError
            ? err.message
            : "Помилка з'єднання. Спробуйте ще раз";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router, attempts, isLocked],
  );

  return { login, isLoading, error, attempts, isLocked, lockedUntil, setError };
}

/**
 * Hook for requesting a password-reset email.
 * Rate-limited: 60 seconds between requests.
 *
 * @returns sendResetEmail function, loading state, error, last-sent timestamp
 */
export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  const canResend = lastSentAt === null || Date.now() - lastSentAt >= 60_000;

  const sendResetEmail = useCallback(async (dto: ForgotPasswordDto) => {
    if (!canResend) return;
    setIsLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(dto);
      setLastSentAt(Date.now());
    } catch {
      setError("Помилка з'єднання. Спробуйте ще раз");
    } finally {
      setIsLoading(false);
    }
  }, [canResend]);

  return { sendResetEmail, isLoading, error, lastSentAt, canResend };
}

/**
 * Hook for resetting the user password via a token from email.
 *
 * @returns resetPassword function, loading state, error
 */
export function useResetPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = useCallback(
    async (dto: ResetPasswordDto) => {
      setIsLoading(true);
      setError(null);
      try {
        const { accessToken } = await authApi.resetPassword(dto);
        setAccessToken(accessToken);
        router.push('/home');
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Помилка з'єднання. Спробуйте ще раз";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return { resetPassword, isLoading, error };
}

/**
 * Hook for logging out the user.
 * Clears the in-memory access token and fires a best-effort logout request.
 */
export function useLogout() {
  const router = useRouter();

  const logout = useCallback(() => {
    setAccessToken(null);
    authApi.logout().catch(() => {});
    router.push('/welcome');
  }, [router]);

  return { logout };
}
