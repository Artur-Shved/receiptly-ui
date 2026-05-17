import { apiClient } from './client';
import type { Store, CreateStoreDto, UpdateStoreDto, DeleteStoreResponse } from '@/src/types/store.types';

export const storesApi = {
  /** GET /stores — system stores first, then user's */
  getAll: () => apiClient.get<Store[]>('/stores'),

  /** POST /stores — create user-owned store */
  create: (dto: CreateStoreDto) => apiClient.post<Store>('/stores', dto),

  /** PATCH /stores/:id — rename user-owned store */
  update: (id: string, dto: UpdateStoreDto) =>
    apiClient.patch<Store>(`/stores/${id}`, dto),

  /** DELETE /stores/:id — returns receiptsCount for client warning */
  remove: (id: string) => apiClient.delete<DeleteStoreResponse>(`/stores/${id}`),
};
