'use client';

import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useStores } from '@/src/hooks/useStores';
import { useTransactionCategories } from '@/src/hooks/useTransactionCategories';
import { useItemCategories } from '@/src/hooks/useItemCategories';

interface Props {
  initial: {
    storeId: string[];
    transactionCategoryId: string[];
    itemCategoryId: string[];
  };
  onApply: (next: {
    storeId: string[];
    transactionCategoryId: string[];
    itemCategoryId: string[];
  }) => void;
  onClose: () => void;
}

interface Option {
  id: string;
  name: string;
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex h-4 w-4 items-center justify-center rounded"
      style={{
        backgroundColor: checked ? '#1a1a1a' : '#fff',
        border: checked ? '0.5px solid #1a1a1a' : '0.5px solid #d1d5db',
      }}
    >
      {checked && <Check size={11} color="#fff" />}
    </span>
  );
}

function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-wide text-[#9ca3af]">{title}</p>
      <div className="max-h-[180px] overflow-y-auto">
        {options.map((opt) => {
          const checked = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className="flex w-full items-center gap-3 border-b border-[#e5e7eb] py-2 text-left last:border-b-0"
            >
              <Checkbox checked={checked} />
              <span className="text-[13px] text-[#1a1a1a]">{opt.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FiltersModal({ initial, onApply, onClose }: Props) {
  const { stores } = useStores();
  const { categories: txCategories } = useTransactionCategories();
  const { categories: itemCategories } = useItemCategories();

  const [storeIds, setStoreIds] = useState<string[]>(initial.storeId);
  const [txCatIds, setTxCatIds] = useState<string[]>(initial.transactionCategoryId);
  const [itemCatIds, setItemCatIds] = useState<string[]>(initial.itemCategoryId);

  useEffect(() => {
    setStoreIds(initial.storeId);
    setTxCatIds(initial.transactionCategoryId);
    setItemCatIds(initial.itemCategoryId);
  }, [initial]);

  const toggle = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const totalSelected = storeIds.length + txCatIds.length + itemCatIds.length;

  const handleApply = () => {
    onApply({
      storeId: storeIds,
      transactionCategoryId: txCatIds,
      itemCategoryId: itemCatIds,
    });
  };

  const handleReset = () => {
    setStoreIds([]);
    setTxCatIds([]);
    setItemCatIds([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-[380px] max-w-[calc(100%-32px)] rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5e7eb] p-5">
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">Фільтри</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-[12px] text-[#6b7280] underline hover:text-[#1a1a1a]"
            >
              Скинути
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <FilterSection
            title="Магазин"
            options={stores}
            selected={storeIds}
            onToggle={(id) => setStoreIds(toggle(storeIds, id))}
          />
          <FilterSection
            title="Категорія транзакції"
            options={txCategories}
            selected={txCatIds}
            onToggle={(id) => setTxCatIds(toggle(txCatIds, id))}
          />
          <FilterSection
            title="Категорія товару"
            options={itemCategories}
            selected={itemCatIds}
            onToggle={(id) => setItemCatIds(toggle(itemCatIds, id))}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] p-4">
          <Button
            variant="secondary"
            fullWidth={false}
            className="py-2 px-4 text-[13px]"
            onClick={onClose}
          >
            Скасувати
          </Button>
          <Button
            fullWidth={false}
            className="py-2 px-4 text-[13px]"
            onClick={handleApply}
          >
            Застосувати{totalSelected > 0 ? ` (${totalSelected})` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
