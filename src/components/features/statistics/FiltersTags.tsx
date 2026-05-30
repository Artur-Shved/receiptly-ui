'use client';

import { X, SlidersHorizontal } from 'lucide-react';
import type { Store } from '@/src/types/store.types';
import type { TransactionCategory } from '@/src/types/transaction-category.types';
import type { ItemCategory } from '@/src/types/item-category.types';

interface ActiveFilters {
  storeId: string[];
  transactionCategoryId: string[];
  itemCategoryId: string[];
}

interface Props {
  filters: ActiveFilters;
  stores: Store[];
  txCategories: TransactionCategory[];
  itemCategories: ItemCategory[];
  onOpenFilters: () => void;
  onRemove: (kind: keyof ActiveFilters, id: string) => void;
  onResetAll: () => void;
}

export function FilterButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[34px] items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-3 text-[12px] text-[#1a1a1a] hover:border-[#9ca3af]"
    >
      <SlidersHorizontal size={13} />
      Фільтри
      {count > 0 && (
        <span
          className="ml-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-medium"
          style={{ backgroundColor: '#1a1a1a', color: '#fff' }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function FiltersTags({
  filters,
  stores,
  txCategories,
  itemCategories,
  onRemove,
  onResetAll,
}: Omit<Props, 'onOpenFilters'>) {
  const tags: Array<{ kind: keyof ActiveFilters; id: string; label: string }> = [];

  for (const id of filters.storeId) {
    const s = stores.find((x) => x.id === id);
    tags.push({ kind: 'storeId', id, label: s?.name ?? id });
  }
  for (const id of filters.transactionCategoryId) {
    const c = txCategories.find((x) => x.id === id);
    tags.push({ kind: 'transactionCategoryId', id, label: c?.name ?? id });
  }
  for (const id of filters.itemCategoryId) {
    const c = itemCategories.find((x) => x.id === id);
    tags.push({ kind: 'itemCategoryId', id, label: c?.name ?? id });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] text-[#9ca3af]">Активні фільтри:</span>
      {tags.map((t) => (
        <span
          key={`${t.kind}-${t.id}`}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-[#1a1a1a]"
          style={{ backgroundColor: '#F7F7F7', border: '0.5px solid #e5e7eb' }}
        >
          {t.label}
          <button
            type="button"
            onClick={() => onRemove(t.kind, t.id)}
            className="flex h-4 w-4 items-center justify-center rounded text-[#9ca3af] hover:bg-[#e5e7eb] hover:text-[#1a1a1a]"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onResetAll}
        className="text-[12px] text-[#6b7280] underline hover:text-[#1a1a1a]"
      >
        Скинути всі
      </button>
    </div>
  );
}
