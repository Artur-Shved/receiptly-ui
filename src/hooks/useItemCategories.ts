'use client';

import { useState, useCallback, useEffect } from 'react';
import { itemCategoriesApi } from '@/src/api/item-categories.api';
import { ApiError } from '@/src/types/api.types';
import type { ItemCategory } from '@/src/types/item-category.types';

function sortCategories(categories: ItemCategory[]): ItemCategory[] {
  const system = categories
    .filter((c) => c.userId === null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const user = categories
    .filter((c) => c.userId !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...system, ...user];
}

export function useItemCategories() {
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await itemCategoriesApi.getAll();
      setCategories(sortCategories(data));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Помилка завантаження');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createCategory = useCallback(
    async (name: string): Promise<{ category?: ItemCategory; error?: string }> => {
      try {
        const created = await itemCategoriesApi.create({ name });
        setCategories((prev) => sortCategories([...prev, created]));
        return { category: created };
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          return { error: 'Категорія з такою назвою вже існує' };
        }
        return { error: 'Помилка створення' };
      }
    },
    [],
  );

  const updateCategory = useCallback(
    async (id: string, name: string): Promise<{ error?: string }> => {
      try {
        const updated = await itemCategoriesApi.update(id, { name });
        setCategories((prev) =>
          sortCategories(prev.map((c) => (c.id === id ? updated : c))),
        );
        return {};
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 409) return { error: 'Категорія з такою назвою вже існує' };
          if (err.status === 403) return { error: 'Не можна редагувати цю категорію' };
        }
        return { error: 'Помилка оновлення' };
      }
    },
    [],
  );

  const removeCategory = useCallback(
    async (id: string): Promise<{ itemsCount?: number; error?: string }> => {
      try {
        const result = await itemCategoriesApi.remove(id);
        return { itemsCount: result.itemsCount };
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 403) return { error: 'Не можна видалити цю категорію' };
        }
        return { error: 'Помилка видалення' };
      }
    },
    [],
  );

  const removeConfirmedCategory = useCallback(
    async (id: string): Promise<{ error?: string }> => {
      try {
        await itemCategoriesApi.removeConfirmed(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        return {};
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 403) return { error: 'Не можна видалити цю категорію' };
        }
        return { error: 'Помилка видалення' };
      }
    },
    [],
  );

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    removeCategory,
    removeConfirmedCategory,
  };
}
