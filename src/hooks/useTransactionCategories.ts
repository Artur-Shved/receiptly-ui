'use client';

import { useState, useCallback, useEffect } from 'react';
import { transactionCategoriesApi } from '@/src/api/transaction-categories.api';
import { ApiError } from '@/src/types/api.types';
import type { TransactionCategory } from '@/src/types/transaction-category.types';

function sortCategories(categories: TransactionCategory[]): TransactionCategory[] {
  const system = categories
    .filter((c) => c.userId === null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const user = categories
    .filter((c) => c.userId !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...system, ...user];
}

export function useTransactionCategories() {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transactionCategoriesApi.getAll();
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
    async (name: string): Promise<{ error?: string }> => {
      try {
        const created = await transactionCategoriesApi.create({ name });
        setCategories((prev) => sortCategories([...prev, created]));
        return {};
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
        const updated = await transactionCategoriesApi.update(id, { name });
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

  return { categories, isLoading, error, createCategory, updateCategory };
}
