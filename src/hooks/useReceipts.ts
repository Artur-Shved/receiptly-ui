'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { receiptsApi, type ReceiptListParams } from '@/src/api/receipts.api';
import { ApiError } from '@/src/types/api.types';
import type { Receipt, CreateReceiptDto, UpdateReceiptDto } from '@/src/types/receipt.types';

const PAGE_SIZE = 5;

/** Filter subset accepted by the list (page/limit are managed internally). */
export type ReceiptFilters = Pick<
  ReceiptListParams,
  'storeName' | 'dateFrom' | 'dateTo' | 'transactionCategoryIds' | 'storeIds'
>;

/**
 * Paginated receipts list with server-side filtering.
 * `loadMore` appends the next page; `refresh`/`reload` reset to page 1.
 * Changing `filters` (store name / date range / categories / stores) resets
 * to page 1 automatically — all filtering happens on the server, so results
 * span the whole dataset rather than the currently loaded page.
 */
export function useReceipts(filters: ReceiptFilters = {}) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Stable identity for the current filter set — drives reload on change.
  const filterKey = useMemo(
    () =>
      JSON.stringify({
        s: filters.storeName ?? null,
        df: filters.dateFrom ?? null,
        dt: filters.dateTo ?? null,
        c: filters.transactionCategoryIds ?? [],
        st: filters.storeIds ?? [],
      }),
    [
      filters.storeName,
      filters.dateFrom,
      filters.dateTo,
      filters.transactionCategoryIds,
      filters.storeIds,
    ],
  );

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await receiptsApi.getAll({
          page: pageNum,
          limit: PAGE_SIZE,
          storeName: filters.storeName,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          transactionCategoryIds: filters.transactionCategoryIds,
          storeIds: filters.storeIds,
        });
        setReceipts((prev) => (append ? [...prev, ...res.data] : res.data));
        setTotal(res.total);
        setHasMore(res.hasMore);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Помилка завантаження');
      } finally {
        setIsLoading(false);
      }
      // filterKey captures all filter values; loadPage rebuilds when they change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [filterKey],
  );

  useEffect(() => {
    setPage(1);
    loadPage(1, false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await loadPage(nextPage, true);
  }, [page, loadPage]);

  const refresh = useCallback(() => {
    setPage(1);
    return loadPage(1, false);
  }, [loadPage]);

  // Silent reload — resets to page 1 to reflect external edits/deletes.
  const reload = useCallback(() => loadPage(1, false), [loadPage]);

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
    reload,
  };
}
