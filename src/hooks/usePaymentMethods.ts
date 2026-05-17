'use client';

import { useState, useCallback, useEffect } from 'react';
import { paymentMethodsApi } from '@/src/api/payment-methods.api';
import { ApiError } from '@/src/types/api.types';
import type { PaymentMethod } from '@/src/types/payment-method.types';

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await paymentMethodsApi.getAll();
      setMethods(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Помилка завантаження');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createMethod = useCallback(
    async (name: string): Promise<{ error?: string }> => {
      try {
        const created = await paymentMethodsApi.create({ name });
        setMethods((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return {};
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          return { error: 'Метод оплати з такою назвою вже існує' };
        }
        return { error: 'Помилка створення' };
      }
    },
    [],
  );

  const updateMethod = useCallback(
    async (
      id: string,
      dto: { name?: string },
    ): Promise<{ error?: string }> => {
      try {
        const updated = await paymentMethodsApi.update(id, dto);
        setMethods((prev) =>
          prev.map((m) => (m.id === id ? updated : m)).sort((a, b) => a.name.localeCompare(b.name)),
        );
        return {};
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 409) return { error: 'Метод оплати з такою назвою вже існує' };
          if (err.status === 403) return { error: 'Не можна редагувати цей метод' };
        }
        return { error: 'Помилка оновлення' };
      }
    },
    [],
  );

  const removeMethod = useCallback(
    async (id: string): Promise<{ error?: string }> => {
      try {
        await paymentMethodsApi.remove(id);
        setMethods((prev) => prev.filter((m) => m.id !== id));
        return {};
      } catch (err) {
        return { error: (err as ApiError).message ?? 'Помилка' };
      }
    },
    [],
  );

  return { methods, isLoading, error, createMethod, updateMethod, removeMethod };
}
