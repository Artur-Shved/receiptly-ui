import { apiClient } from './client';
import type {
  PaymentMethod,
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from '@/src/types/payment-method.types';

export const paymentMethodsApi = {
  /** GET /payment-methods — user's methods sorted by name */
  getAll: () => apiClient.get<PaymentMethod[]>('/payment-methods'),

  /** POST /payment-methods — create new method */
  create: (dto: CreatePaymentMethodDto) =>
    apiClient.post<PaymentMethod>('/payment-methods', dto),

  /** PATCH /payment-methods/:id — patch name */
  update: (id: string, dto: UpdatePaymentMethodDto) =>
    apiClient.patch<PaymentMethod>(`/payment-methods/${id}`, dto),
};
