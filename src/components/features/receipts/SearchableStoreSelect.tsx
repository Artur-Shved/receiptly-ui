'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import type { Store } from '@/src/types/store.types';

interface Props {
  value: string | null;
  onChange: (storeId: string | null) => void;
  stores: Store[];
  onCreate: (name: string) => Promise<Store | null>;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableStoreSelect({
  value,
  onChange,
  stores,
  onCreate,
  placeholder = 'Оберіть або введіть магазин',
  disabled,
}: Props) {
  const selectedStore = useMemo(
    () => stores.find((s) => s.id === value) ?? null,
    [stores, value],
  );

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const trimmedQuery = query.trim();

  const matches = useMemo(() => {
    if (!trimmedQuery) return stores;
    const q = trimmedQuery.toLowerCase();
    return stores.filter((s) => s.name.toLowerCase().includes(q));
  }, [stores, trimmedQuery]);

  const exactMatch = useMemo(
    () =>
      trimmedQuery
        ? stores.some((s) => s.name.toLowerCase() === trimmedQuery.toLowerCase())
        : false,
    [stores, trimmedQuery],
  );

  const canCreate = trimmedQuery.length > 0 && !exactMatch;

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setCreateError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSelect = (storeId: string) => {
    onChange(storeId);
    setIsOpen(false);
    setQuery('');
    setCreateError(null);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
    setCreateError(null);
  };

  const handleCreate = async () => {
    if (!canCreate || isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    const created = await onCreate(trimmedQuery);
    setIsCreating(false);
    if (created) {
      onChange(created.id);
      setQuery('');
      setIsOpen(false);
    } else {
      setCreateError('Не вдалося створити магазин');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0) {
        handleSelect(matches[0].id);
      } else if (canCreate) {
        void handleCreate();
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Closed state: button-like display */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className="flex h-[38px] w-full items-center justify-between rounded-lg border border-[#e5e7eb] bg-white px-3 text-left text-[13px] outline-none transition-colors hover:border-[#9ca3af] focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={selectedStore ? 'text-[#1a1a1a]' : 'text-[#9ca3af]'}>
            {selectedStore ? selectedStore.name : placeholder}
          </span>
          {selectedStore ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent);
              }}
              className="ml-2 flex h-5 w-5 items-center justify-center rounded text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
            >
              <X size={13} />
            </span>
          ) : (
            <Search size={13} className="ml-2 text-[#9ca3af]" />
          )}
        </button>
      )}

      {/* Open state: search input + dropdown */}
      {isOpen && (
        <>
          <div className="flex h-[38px] w-full items-center rounded-lg border border-[#1a1a1a] bg-white px-3 ring-1 ring-[#1a1a1a]">
            <Search size={13} className="mr-2 flex-shrink-0 text-[#9ca3af]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCreateError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Введіть назву..."
              className="flex-1 bg-transparent text-[13px] text-[#1a1a1a] outline-none placeholder:text-[#9ca3af]"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="ml-2 flex h-5 w-5 items-center justify-center rounded text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="absolute left-0 right-0 top-[42px] z-30 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
            <div className="max-h-[240px] overflow-y-auto">
              {matches.length === 0 && !canCreate && (
                <div className="px-3 py-3 text-[13px] text-[#9ca3af]">Нічого не знайдено</div>
              )}
              {matches.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => handleSelect(store.id)}
                  className={`flex w-full items-center px-3 py-2 text-left text-[13px] hover:bg-[#F7F7F7] ${
                    store.id === value ? 'font-medium text-[#1a1a1a]' : 'text-[#1a1a1a]'
                  }`}
                >
                  {store.name}
                </button>
              ))}
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="flex w-full items-center gap-2 border-t border-[#e5e7eb] px-3 py-2 text-left text-[13px] text-[#1a1a1a] hover:bg-[#F7F7F7] disabled:opacity-60"
              >
                <Plus size={13} className="text-[#3B6D11]" />
                <span>
                  {isCreating ? 'Створюємо...' : <>Додати &laquo;{trimmedQuery}&raquo; як новий магазин</>}
                </span>
              </button>
            )}
          </div>
        </>
      )}

      {createError && (
        <p className="mt-1 text-[12px] text-[#A32D2D]">{createError}</p>
      )}
    </div>
  );
}
