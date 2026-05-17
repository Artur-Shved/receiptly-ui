import { apiClient } from './client';
import type {
  ItemCategory,
  CreateItemCategoryDto,
  UpdateItemCategoryDto,
  RemoveItemCategoryResponse,
} from '@/src/types/item-category.types';

export const itemCategoriesApi = {
  /** GET /item-categories — system categories first, then user's */
  getAll: () => apiClient.get<ItemCategory[]>('/item-categories'),

  /** POST /item-categories — create user-owned category */
  create: (dto: CreateItemCategoryDto) =>
    apiClient.post<ItemCategory>('/item-categories', dto),

  /** PATCH /item-categories/:id — rename user-owned category */
  update: (id: string, dto: UpdateItemCategoryDto) =>
    apiClient.patch<ItemCategory>(`/item-categories/${id}`, dto),

  /** DELETE /item-categories/:id — check if category is used, returns itemsCount */
  remove: (id: string) =>
    apiClient.delete<RemoveItemCategoryResponse>(`/item-categories/${id}`),

  /** DELETE /item-categories/:id/confirm — confirm deletion */
  removeConfirmed: (id: string) =>
    apiClient.delete<void>(`/item-categories/${id}/confirm`),
};
