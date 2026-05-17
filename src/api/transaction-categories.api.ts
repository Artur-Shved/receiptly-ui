import { apiClient } from './client';
import type {
  TransactionCategory,
  CreateTransactionCategoryDto,
  UpdateTransactionCategoryDto,
} from '@/src/types/transaction-category.types';

export const transactionCategoriesApi = {
  /** GET /transaction-categories — system categories first, then user's */
  getAll: () => apiClient.get<TransactionCategory[]>('/transaction-categories'),

  /** POST /transaction-categories — create user-owned category */
  create: (dto: CreateTransactionCategoryDto) =>
    apiClient.post<TransactionCategory>('/transaction-categories', dto),

  /** PATCH /transaction-categories/:id — rename user-owned category */
  update: (id: string, dto: UpdateTransactionCategoryDto) =>
    apiClient.patch<TransactionCategory>(`/transaction-categories/${id}`, dto),
};
