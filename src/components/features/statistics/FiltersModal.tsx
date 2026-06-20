'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { X, Check, Search } from 'lucide-react';
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

type SectionKey = 'stores' | 'txCategories' | 'itemCategories';

const StoreIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <rect x="1.5" y="7.5" width="11" height="5" rx="1" fill="currentColor" />
    <path
      d="M1 7.5h12M4 7.5V5a3 3 0 016 0v2.5"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const TxCategoryIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <path
      d="M7 1.5l1.5 3H12L9.5 6.5l1 3L7 7.5l-3.5 2 1-3L2 4.5h3.5L7 1.5z"
      fill="currentColor"
    />
  </svg>
);

const ItemCategoryIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <rect x="2" y="4" width="10" height="8.5" rx="1.5" fill="currentColor" opacity="0.2" />
    <rect
      x="2"
      y="4"
      width="10"
      height="8.5"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.1"
      fill="none"
    />
    <path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.1" fill="none" />
    <path d="M5 7.5h4M5 9.5h2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

function SectionBtn({
  icon,
  iconBg,
  iconColor,
  label,
  selected,
  options,
  active,
  onClick,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  selected: string[];
  options: Option[];
  active: boolean;
  onClick: () => void;
}) {
  const selectedNames = options
    .filter((o) => selected.includes(o.id))
    .map((o) => o.name);
  const preview =
    selectedNames.length === 0
      ? null
      : selectedNames.slice(0, 2).join(', ') + (selectedNames.length > 2 ? '…' : '');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center gap-2.5 border-b border-[#F0F0F0] px-3 py-2.5 text-left ${
        active ? 'border-l-2 border-l-[#0F6E56] bg-white pl-[10px]' : 'bg-transparent'
      }`}
    >
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center"
        style={{ backgroundColor: iconBg, color: iconColor, borderRadius: 7 }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-tight text-[#1a1a1a]">{label}</p>
        {preview ? (
          <p className="truncate text-[11px] font-medium text-[#0F6E56]">{preview}</p>
        ) : (
          <p className="text-[11px] text-[#9CA3AF]">Не вибрано</p>
        )}
      </div>
      {selected.length > 0 && (
        <span className="flex-shrink-0 rounded-full bg-[#0F6E56] px-1.5 py-0.5 text-[10px] font-bold text-white">
          {selected.length}
        </span>
      )}
    </button>
  );
}

export function FiltersModal({ initial, onApply, onClose }: Props) {
  const { stores } = useStores();
  const { categories: txCategories } = useTransactionCategories();
  const { categories: itemCategories } = useItemCategories();

  const [storeIds, setStoreIds] = useState<string[]>(initial.storeId);
  const [txCatIds, setTxCatIds] = useState<string[]>(initial.transactionCategoryId);
  const [itemCatIds, setItemCatIds] = useState<string[]>(initial.itemCategoryId);
  const [activeSection, setActiveSection] = useState<SectionKey>('stores');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setStoreIds(initial.storeId);
    setTxCatIds(initial.transactionCategoryId);
    setItemCatIds(initial.itemCategoryId);
  }, [initial]);

  const switchSection = (key: SectionKey) => {
    setActiveSection(key);
    setSearch('');
    setVisibleCount(10);
  };

  function getCurrentSection() {
    if (activeSection === 'stores') {
      return {
        options: stores.map((x) => ({ id: x.id, name: x.name })),
        selectedIds: storeIds,
        toggle: (id: string) =>
          setStoreIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          ),
      };
    }
    if (activeSection === 'txCategories') {
      return {
        options: txCategories.map((x) => ({ id: x.id, name: x.name })),
        selectedIds: txCatIds,
        toggle: (id: string) =>
          setTxCatIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          ),
      };
    }
    return {
      options: itemCategories.map((x) => ({ id: x.id, name: x.name })),
      selectedIds: itemCatIds,
      toggle: (id: string) =>
        setItemCatIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        ),
    };
  }

  const { options: curOptions, selectedIds: curSelected, toggle: toggleItem } =
    getCurrentSection();

  const filtered = curOptions.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedItems = filtered.filter((o) => curSelected.includes(o.id));
  const unselectedItems = filtered.filter((o) => !curSelected.includes(o.id));
  const visibleUnselected = unselectedItems.slice(0, visibleCount);
  const hasMore = unselectedItems.length > visibleCount;
  const remaining = unselectedItems.length - visibleCount;

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

  const renderRow = (opt: Option) => {
    const isSelected = curSelected.includes(opt.id);
    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => toggleItem(opt.id)}
        className={`flex w-full items-center gap-2.5 border-b border-[#F5F5F5] px-3 py-2 text-left hover:bg-[#FAFAFA] ${
          isSelected ? 'bg-[#F5FFF9]' : ''
        }`}
      >
        <span
          className={`flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center rounded-[4px] border ${
            isSelected ? 'border-[#0F6E56] bg-[#0F6E56]' : 'border-[#D1D5DB] bg-white'
          }`}
        >
          {isSelected && <Check size={9} color="white" strokeWidth={2.5} />}
        </span>
        <span className="text-[13px] text-[#1a1a1a]">{opt.name}</span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[560px] w-[620px] max-w-full flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center border-b border-[#E5E7EB] px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">Фільтри</h2>
          <div className="flex-1" />
          {totalSelected > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="mr-2 text-[12px] text-gray-500 underline hover:text-[#1a1a1a]"
            >
              Скинути
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left: section list */}
          <div className="w-[180px] flex-shrink-0 overflow-y-auto border-r border-[#E5E7EB] bg-[#FAFAFA]">
            <SectionBtn
              icon={StoreIcon}
              iconBg="#E1F5EE"
              iconColor="#0F6E56"
              label="Магазини"
              selected={storeIds}
              options={stores.map((x) => ({ id: x.id, name: x.name }))}
              active={activeSection === 'stores'}
              onClick={() => switchSection('stores')}
            />
            <SectionBtn
              icon={TxCategoryIcon}
              iconBg="#FEF9C3"
              iconColor="#D97706"
              label="Кат. транзакцій"
              selected={txCatIds}
              options={txCategories.map((x) => ({ id: x.id, name: x.name }))}
              active={activeSection === 'txCategories'}
              onClick={() => switchSection('txCategories')}
            />
            <SectionBtn
              icon={ItemCategoryIcon}
              iconBg="#EDE9FE"
              iconColor="#7C3AED"
              label="Кат. товарів"
              selected={itemCatIds}
              options={itemCategories.map((x) => ({ id: x.id, name: x.name }))}
              active={activeSection === 'itemCategories'}
              onClick={() => switchSection('itemCategories')}
            />
          </div>

          {/* Right: search + list */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Search */}
            <div className="border-b border-[#EBEBEB] px-3 py-2">
              <div className="flex items-center gap-2 rounded-[8px] bg-[#F5F5F5] px-3 py-1.5">
                <Search size={13} className="flex-shrink-0 text-[#9CA3AF]" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleCount(10);
                  }}
                  placeholder="Пошук..."
                  className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#9CA3AF]"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')}>
                    <X size={12} className="text-[#9CA3AF]" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12px] text-[#9CA3AF]">
                  Нічого не знайдено
                </div>
              ) : (
                <>
                  {selectedItems.length > 0 && (
                    <>
                      <div className="border-b border-[#F0F0F0] bg-[#F9F9F9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                        Вибрані
                      </div>
                      {selectedItems.map(renderRow)}
                    </>
                  )}

                  <div className="border-b border-[#F0F0F0] bg-[#F9F9F9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Усі · {unselectedItems.length === 0 ? 0 : 1}-
                    {Math.min(visibleCount, unselectedItems.length)} з {unselectedItems.length}
                  </div>
                  {visibleUnselected.map(renderRow)}

                  {hasMore && (
                    <div className="flex items-center justify-between border-t border-[#E5E7EB] px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((v) => v + 10)}
                        className="text-[12px] font-medium text-[#0F6E56] hover:underline"
                      >
                        Ще {remaining} →
                      </button>
                      <span className="text-[11px] text-[#9CA3AF]">
                        {visibleCount} / {unselectedItems.length}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
          <Button
            variant="secondary"
            fullWidth={false}
            className="px-4 py-2 text-[13px]"
            onClick={onClose}
          >
            Скасувати
          </Button>
          <Button
            fullWidth={false}
            className="px-4 py-2 text-[13px]"
            onClick={handleApply}
          >
            {totalSelected > 0 ? `Застосувати (${totalSelected})` : 'Застосувати'}
          </Button>
        </div>
      </div>
    </div>
  );
}
