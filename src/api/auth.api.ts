import { apiClient } from './client';
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponse,
} from '@/src/types/auth.types';

/**
 * Auth API — maps to endpoints defined in api-contract.json.
 * All requests include httpOnly refresh-token cookie automatically via credentials: 'include'.
 */
export const authApi = {
  /** POST /auth/register */
  register: (dto: RegisterDto) =>
    apiClient.post<AuthResponse>('/auth/register', dto),

  /** POST /auth/login */
  login: (dto: LoginDto) =>
    apiClient.post<AuthResponse>('/auth/login', dto),

  /** POST /auth/logout — fire-and-forget on client */
  logout: () => apiClient.post<void>('/auth/logout'),

  /** POST /auth/refresh — rotates refresh token cookie */
  refresh: () => apiClient.post<AuthResponse>('/auth/refresh'),

  /** POST /auth/forgot-password — always returns 200 */
  forgotPassword: (dto: ForgotPasswordDto) =>
    apiClient.post<void>('/auth/forgot-password', dto),

  /** POST /auth/reset-password */
  resetPassword: (dto: ResetPasswordDto) =>
    apiClient.post<AuthResponse>('/auth/reset-password', dto),
};
