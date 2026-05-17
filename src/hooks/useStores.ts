'use client';

import { useState, useCallback, useEffect } from 'react';
import { storesApi } from '@/src/api/stores.api';
import { ApiError } from '@/src/types/api.types';
import type { Store } from '@/src/types/store.types';

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await storesApi.getAll();
      setStores(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Помилка завантаження');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createStore = useCallback(
    async (name: string): Promise<{ error?: string }> => {
      try {
        const created = await storesApi.create({ name });
        setStores((prev) => [...prev, created]);
        return {};
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          return { error: 'Магазин з такою назвою вже існує' };
        }
        return { error: 'Помилка створення' };
      }
    },
    [],
  );

  const updateStore = useCallback(
    async (id: string, name: string): Promise<{ error?: string }> => {
      try {
        const updated = await storesApi.update(id, { name });
        setStores((prev) => prev.map((s) => (s.id === id ? updated : s)));
        return {};
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 409) return { error: 'Магазин з такою назвою вже існує' };
          if (err.status === 403) return { error: 'Не можна редагувати цей магазин' };
        }
        return { error: 'Помилка оновлення' };
      }
    },
    [],
  );

  const removeStore = useCallback(
    async (id: string): Promise<{ receiptsCount?: number; error?: string }> => {
      try {
        const result = await storesApi.remove(id);
        setStores((prev) => prev.filter((s) => s.id !== id));
        return { receiptsCount: result.receiptsCount };
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          return { error: 'Не можна видалити цей магазин' };
        }
        return { error: 'Помилка видалення' };
      }
    },
    [],
  );

  return { stores, isLoading, error, createStore, updateStore, removeStore };
}
