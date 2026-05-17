'use client';

import { useState, useCallback, useEffect } from 'react';
import { receiptsApi } from '@/src/api/receipts.api';
import { ApiError } from '@/src/types/api.types';
import type { Receipt, CreateReceiptDto, UpdateReceiptDto } from '@/src/types/receipt.types';

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (pageNum: number, append: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await receiptsApi.getAll(pageNum, 20);
      setReceipts((prev) => (append ? [...prev, ...res.data] : res.data));
      setTotal(res.total);
      setHasMore(res.hasMore);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Помилка завантаження');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await load(nextPage, true);
  }, [page, load]);

  const refresh = useCallback(async () => {
    setPage(1);
    await load(1, false);
  }, [load]);

  const createReceipt = useCallback(
    async (dto: CreateReceiptDto): Promise<{ error?: string }> => {
      try {
        const created = await receiptsApi.create(dto);
        setReceipts((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
        return {};
      } catch (err) {
        return { error: err instanceof ApiError ? err.message : 'Помилка створення' };
      }
    },
    [],
  );

  const updateReceipt = useCallback(
    async (id: string, dto: UpdateReceiptDto): Promise<{ error?: string }> => {
      try {
        const updated = await receiptsApi.update(id, dto);
        setReceipts((prev) => prev.map((r) => (r.id === id ? updated : r)));
        return {};
      } catch (err) {
        return { error: err instanceof ApiError ? err.message : 'Помилка оновлення' };
      }
    },
    [],
  );

  const removeReceipt = useCallback(
    async (id: string): Promise<{ error?: string }> => {
      try {
        await receiptsApi.remove(id);
        setReceipts((prev) => prev.filter((r) => r.id !== id));
        setTotal((t) => Math.max(0, t - 1));
        return {};
      } catch (err) {
        return { error: err instanceof ApiError ? err.message : 'Помилка видалення' };
      }
    },
    [],
  );

  return {
    receipts,
    total,
    isLoading,
    error,
    page,
    hasMore,
    loadMore,
    createReceipt,
    updateReceipt,
    removeReceipt,
    refresh,
  };
}
