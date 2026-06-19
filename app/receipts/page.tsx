'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  WifiOff,
  Search,
  Pencil,
  Trash2,
  X,
  Calendar,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { TopNav } from '@/src/components/features/home/TopNav';
import { Button } from '@/src/components/ui/Button';
import { SearchableStoreSelect } from '@/src/components/features/receipts/SearchableStoreSelect';
import { SearchableEntitySelect } from '@/src/components/features/receipts/SearchableEntitySelect';
import { AddReceiptChoiceModal } from '@/src/components/features/receipts/AddReceiptChoiceModal';
import {
  ReceiptDetailsModal,
  ItemCategoryBadge,
} from '@/src/components/features/receipts/ReceiptDetailsModal';
import { receiptsApi } from '@/src/api/receipts.api';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { categoryColor } from '@/src/lib/category-colors';
import { useLogout } from '@/src/hooks/useAuth';
import { useReceipts } from '@/src/hooks/useReceipts';
import { useStores } from '@/src/hooks/useStores';
import { usePaymentMethods } from '@/src/hooks/usePaymentMethods';
import { useTransactionCategories } from '@/src/hooks/useTransactionCategories';
import { useItemCategories } from '@/src/hooks/useItemCategories';
import type {
  Receipt as ReceiptType,
  CreateReceiptItemDto,
  UpdateReceiptDto,
} from '@/src/types/receipt.types';
import type { ItemCategory } from '@/src/types/item-category.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UK_MONTHS_SHORT = [
  'січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
  'лип', 'серп', 'вер', 'жовт', 'лист', 'груд',
];
const UK_MONTHS_LONG = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${UK_MONTHS_SHORT[d.getMonth()]}`;
}

function formatMonthYear(ym: string): string {
  const [year, month] = ym.split('-');
  return `${UK_MONTHS_LONG[parseInt(month) - 1]} ${year}`;
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

/** Convert a `YYYY-MM` month into inclusive YYYY-MM-DD date bounds. */
function monthToDateRange(ym: string): { dateFrom: string; dateTo: string } {
  const [y, m] = ym.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { dateFrom: `${ym}-01`, dateTo: `${ym}-${String(lastDay).padStart(2, '0')}` };
}

const UK_MONTHS_GENITIVE = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

/** Day-group header label: «Сьогодні» / «Вчора» / «9 червня» (+ рік якщо не поточний). */
function formatGroupLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diffDays === 0) return 'Сьогодні';
  if (diffDays === 1) return 'Вчора';
  const base = `${d.getDate()} ${UK_MONTHS_GENITIVE[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function TransactionCategoryBadge({
  category,
}: {
  category: { id: string; name: string } | null | undefined;
}) {
  if (!category) return <span className="text-[12px] text-[#9ca3af]">—</span>;
  const { bg, text } = categoryColor(category.id);
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {category.name}
    </span>
  );
}

// ─── Logout Modal ──────────────────────────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-[18px] font-medium text-[#1a1a1a]">Вийти з акаунту?</h2>
        <p className="mb-6 text-[14px] text-gray-500">Вас буде перенаправлено на стартовий екран. Дані збережуться.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onCancel}>Скасувати</Button>
          <Button variant="danger" fullWidth={false} onClick={onConfirm}>Вийти</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Sub-Modal ────────────────────────────────────────────────────────────

interface EditableItem extends CreateReceiptItemDto {
  _key: string;
}

interface ItemSubModalProps {
  item: EditableItem | null;
  itemCategories: ItemCategory[];
  onCreateCategory: (name: string) => Promise<ItemCategory | null>;
  onSave: (item: EditableItem) => void;
  onCancel: () => void;
}

const UNITS = ['шт', 'кг', 'л', 'м', 'г'];

function ItemSubModal({ item, itemCategories, onCreateCategory, onSave, onCancel }: ItemSubModalProps) {
  const initialQty = item?.quantity ?? 1;
  const initialPrice = item?.pricePerUnit ?? 0;
  const initialOriginal = item?.originalAmount ?? Math.round(initialQty * initialPrice * 100) / 100;
  const initialDiscount = item?.discountAmount ?? 0;
  const initialAuto = Math.round(initialQty * initialPrice * 100) / 100;

  const [name, setName] = useState(item?.name ?? '');
  const [quantity, setQuantity] = useState(initialQty.toString());
  const [unit, setUnit] = useState(item?.unit ?? 'шт');
  const [pricePerUnit, setPricePerUnit] = useState(initialPrice ? initialPrice.toString() : '');
  const [originalAmountRaw, setOriginalAmountRaw] = useState(initialOriginal ? initialOriginal.toString() : '');
  const [originalManuallyEdited, setOriginalManuallyEdited] = useState(
    item != null && Math.abs(initialOriginal - initialAuto) > 0.01,
  );
  const [discountAmountRaw, setDiscountAmountRaw] = useState(initialDiscount ? initialDiscount.toString() : '');
  const [itemCategoryId, setItemCategoryId] = useState<string>(item?.itemCategoryId ?? '');
  const [error, setError] = useState<string | null>(null);

  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(pricePerUnit) || 0;
  const autoOriginal = Math.round(qty * price * 100) / 100;
  const originalAmount = originalAmountRaw === '' ? autoOriginal : parseFloat(originalAmountRaw) || 0;
  const discountAmount = discountAmountRaw === '' ? 0 : Math.max(0, parseFloat(discountAmountRaw) || 0);
  const finalPrice = Math.max(0, Math.round((originalAmount - discountAmount) * 100) / 100);
  const showAutoHint = originalManuallyEdited && Math.abs(originalAmount - autoOriginal) > 0.01;
  const discountExceedsOriginal = discountAmount > originalAmount;

  const handleQtyChange = (v: string) => {
    setQuantity(v);
    if (!originalManuallyEdited) {
      const q = parseFloat(v) || 0;
      const p = parseFloat(pricePerUnit) || 0;
      setOriginalAmountRaw((Math.round(q * p * 100) / 100).toString());
    }
  };

  const handlePriceChange = (v: string) => {
    setPricePerUnit(v);
    if (!originalManuallyEdited) {
      const q = parseFloat(quantity) || 0;
      const p = parseFloat(v) || 0;
      setOriginalAmountRaw((Math.round(q * p * 100) / 100).toString());
    }
  };

  const handleOriginalChange = (v: string) => {
    setOriginalAmountRaw(v);
    setOriginalManuallyEdited(true);
  };

  const resetOriginalToAuto = () => {
    setOriginalAmountRaw(autoOriginal ? autoOriginal.toString() : '');
    setOriginalManuallyEdited(false);
  };

  const handleSave = () => {
    if (!name.trim()) { setError('Введіть назву товару'); return; }
    if (qty <= 0) { setError('Кількість має бути більше 0'); return; }
    if (price <= 0) { setError('Ціна має бути більше 0'); return; }
    if (originalAmount <= 0) { setError('Сума має бути більше 0'); return; }
    onSave({
      _key: item?._key ?? crypto.randomUUID(),
      name: name.trim(), quantity: qty, unit: unit || undefined,
      pricePerUnit: price,
      originalAmount,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      itemCategoryId: itemCategoryId || null,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onCancel}>
      <div
        className="w-[380px] max-w-full overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        style={{ maxHeight: 'calc(100vh - 32px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-[#1a1a1a]">{item ? 'Редагувати товар' : 'Додати товар'}</h3>
          <button type="button" onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7]"><X size={15} /></button>
        </div>

        {error && <p className="mb-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Назва товару</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Кількість</label>
              <input type="number" min="0" step="0.001" value={quantity} onChange={(e) => handleQtyChange(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Одиниця</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] text-[#1a1a1a] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Ціна за одиницю</label>
            <input type="number" min="0" step="0.01" value={pricePerUnit} onChange={(e) => handlePriceChange(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]" />
          </div>
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <label className="text-[12px] text-gray-500">Сума без знижки ₴</label>
              {showAutoHint && (
                <button
                  type="button"
                  onClick={resetOriginalToAuto}
                  className="text-[11px] text-[#1a1a1a] underline hover:opacity-70"
                >
                  Перерахувати ({autoOriginal} ₴)
                </button>
              )}
            </div>
            <input type="number" min="0" step="0.01" value={originalAmountRaw} onChange={(e) => handleOriginalChange(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]" />
            {!originalManuallyEdited && qty > 0 && price > 0 && (
              <p className="mt-1 text-[11px] text-[#9ca3af]">
                Автоматично: {autoOriginal} ₴ — змініть якщо потрібно
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Знижка ₴ (необов'язково)</label>
            <input
              type="number" min="0" step="0.01"
              value={discountAmountRaw}
              onChange={(e) => setDiscountAmountRaw(e.target.value)}
              placeholder="0"
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
            {discountExceedsOriginal && (
              <p className="mt-1 text-[11px] text-[#854F0B]">
                Знижка перевищує суму товару — фінальна сума буде 0
              </p>
            )}
          </div>
          {(discountAmount > 0 || originalAmount > 0) && (
            <div className="flex items-center justify-between rounded-lg px-3 py-[10px]" style={{ backgroundColor: '#F7F7F7' }}>
              <span className="text-[12px] text-gray-500">Фінальна сума</span>
              <span className="text-[14px] font-medium text-[#1a1a1a]">{finalPrice} ₴</span>
            </div>
          )}
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Категорія</label>
            <SearchableEntitySelect
              value={itemCategoryId || null}
              onChange={(id) => setItemCategoryId(id ?? '')}
              items={itemCategories}
              onCreate={onCreateCategory}
              placeholder="Без категорії"
              createOptionLabel={(q) => `Додати «${q}» як нову категорію товару`}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onCancel} className="py-2 px-4 text-[13px]">Скасувати</Button>
          <Button fullWidth={false} onClick={handleSave} className="py-2 px-4 text-[13px]">Зберегти</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  receipt: ReceiptType;
  onClose: () => void;
  onSave: (id: string, dto: UpdateReceiptDto) => Promise<{ error?: string }>;
}

function EditModal({ receipt, onClose, onSave }: EditModalProps) {
  const { stores, createStore } = useStores();
  const { methods, createMethod } = usePaymentMethods();
  const { categories: txCategories, createCategory: createTxCategory } = useTransactionCategories();
  const { categories: itemCategories, createCategory: createItemCategory } = useItemCategories();

  const [storeId, setStoreId] = useState<string | null>(receipt.storeId);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(receipt.paymentMethodId);
  const [transactionCategoryId, setTransactionCategoryId] = useState<string | null>(receipt.transactionCategoryId);
  const [receiptDate, setReceiptDate] = useState(toDateInputValue(receipt.receiptDate));
  const [items, setItems] = useState<EditableItem[]>(
    (receipt.items ?? []).map((it) => ({
      _key: it.id,
      name: it.name,
      quantity: it.quantity,
      unit: it.unit ?? undefined,
      pricePerUnit: it.pricePerUnit,
      originalAmount: it.originalAmount,
      discountAmount: it.discountAmount,
      itemCategoryId: it.itemCategoryId,
    })),
  );
  const [subModalItem, setSubModalItem] = useState<EditableItem | null | 'new'>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedTotal = items.reduce(
    (s, it) => s + Math.max(0, it.originalAmount - (it.discountAmount ?? 0)),
    0,
  );
  const totalMismatch = Math.abs(computedTotal - receipt.totalAmount) > 0.01;

  const handleSaveItem = (saved: EditableItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i._key === saved._key);
      if (idx === -1) return [...prev, saved];
      const next = [...prev]; next[idx] = saved; return next;
    });
    setSubModalItem(null);
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setIsLoading(true); setError(null);
    const result = await onSave(receipt.id, {
      storeId,
      paymentMethodId,
      transactionCategoryId,
      receiptDate,
      items: items.map(({ _key: _k, ...rest }) => rest),
    });
    setIsLoading(false);
    if (result.error) setError(result.error);
    else onClose();
  };

  const itemForSubModal: EditableItem | null = subModalItem === 'new' ? null : (subModalItem as EditableItem | null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="flex w-[640px] max-w-full flex-col rounded-xl bg-white shadow-xl"
        style={{ maxHeight: 'calc(100vh - 32px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] p-5">
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Редагувати чек</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7]"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && <p className="mb-4 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">{error}</p>}

          <div className="mb-5 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Магазин</label>
              <SearchableStoreSelect
                value={storeId}
                onChange={setStoreId}
                stores={stores}
                onCreate={async (name) => {
                  const { store } = await createStore(name);
                  return store ?? null;
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Метод оплати</label>
              <SearchableEntitySelect
                value={paymentMethodId}
                onChange={setPaymentMethodId}
                items={methods}
                onCreate={async (name) => {
                  const { method } = await createMethod(name);
                  return method ?? null;
                }}
                createOptionLabel={(q) => `Додати «${q}» як новий метод оплати`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Категорія транзакції</label>
              <SearchableEntitySelect
                value={transactionCategoryId}
                onChange={setTransactionCategoryId}
                items={txCategories}
                onCreate={async (name) => {
                  const { category } = await createTxCategory(name);
                  return category ?? null;
                }}
                createOptionLabel={(q) => `Додати «${q}» як нову категорію`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Дата покупки</label>
              <input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]" />
            </div>
          </div>

          <p className="mb-2 text-[12px] uppercase tracking-wide text-[#9ca3af]">Товари</p>
          <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
            {items.map((item) => {
              const discount = item.discountAmount ?? 0;
              const finalPrice = Math.max(0, Math.round((item.originalAmount - discount) * 100) / 100);
              return (
                <div key={item._key} className="flex items-center gap-3 border-b border-[#e5e7eb] p-3 last:border-b-0">
                  <span className="flex-1 text-[13px] text-[#1a1a1a]">{item.name}</span>
                  <ItemCategoryBadge
                    id={item.itemCategoryId}
                    name={item.itemCategoryId ? itemCategories.find((c) => c.id === item.itemCategoryId)?.name : null}
                  />
                  <span className="text-[13px] text-[#6b7280]">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                  {discount > 0 ? (
                    <span className="flex flex-col items-end leading-tight">
                      <span className="text-[11px] text-[#9ca3af] line-through">{item.originalAmount} ₴</span>
                      <span className="text-[12px] font-medium">{finalPrice} ₴</span>
                    </span>
                  ) : (
                    <span className="text-[13px] text-[#6b7280]">{finalPrice} ₴</span>
                  )}
                  <button type="button" onClick={() => setSubModalItem(item)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"><Pencil size={13} /></button>
                  <button type="button" onClick={() => setItems((prev) => prev.filter((i) => i._key !== item._key))} className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#FCEBEB] hover:text-[#A32D2D]"><Trash2 size={13} /></button>
                </div>
              );
            })}
            {items.length === 0 && <div className="px-4 py-4 text-center text-[13px] text-[#9ca3af]">Немає товарів</div>}
          </div>
          <button type="button" onClick={() => setSubModalItem('new')} className="mt-2 text-[13px] text-[#1a1a1a] underline hover:opacity-70">
            + Додати товар
          </button>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12px] text-[#9ca3af]">Перераховано автоматично</span>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[#6b7280]">Загальна сума</span>
              <span className="text-[15px] font-medium">{Math.round(computedTotal * 100) / 100} ₴</span>
            </div>
          </div>

          {totalMismatch && (
            <div className="mt-3 rounded-md px-3 py-2 text-[13px]" style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}>
              Сума відрізняється від оригіналу чеку. Збереження не блокується.
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#e5e7eb] p-5">
          <Button variant="secondary" fullWidth={false} onClick={onClose} className="py-2 px-4 text-[13px]">Скасувати</Button>
          <Button fullWidth={false} isLoading={isLoading} disabled={items.length === 0} onClick={handleSubmit} className="py-2 px-4 text-[13px]">
            Зберегти зміни
          </Button>
        </div>
      </div>

      {subModalItem !== null && (
        <ItemSubModal
          item={itemForSubModal}
          itemCategories={itemCategories}
          onCreateCategory={async (name) => {
            const { category } = await createItemCategory(name);
            return category ?? null;
          }}
          onSave={handleSaveItem}
          onCancel={() => setSubModalItem(null)}
        />
      )}
    </div>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────

interface DeleteModalProps {
  receipt: ReceiptType;
  onClose: () => void;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

function DeleteModal({ receipt, onClose, onDelete }: DeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true); setError(null);
    const result = await onDelete(receipt.id);
    setIsLoading(false);
    if (result.error) setError(result.error);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Видалити чек?</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7]"><X size={16} /></button>
        </div>

        <p className="mb-4 text-[13px] leading-[1.5] text-gray-500">
          Чек буде видалено назавжди разом з усіма товарами. Цю дію не можна скасувати.
        </p>

        <div className="mb-4 rounded-lg p-[10px_12px]" style={{ backgroundColor: '#F7F7F7' }}>
          <p className="text-[12px] text-[#9ca3af]">Що буде видалено</p>
          <p className="mt-1 text-[13px] font-medium text-[#1a1a1a]">
            {receipt.store?.name ?? '—'} — {formatShortDate(receipt.receiptDate)} — {receipt.totalAmount} ₴
          </p>
          <p className="mt-0.5 text-[12px] text-[#9ca3af]">{receipt.items?.length ?? 0} товарів</p>
        </div>

        {error && <p className="mb-4 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onClose} className="py-2 px-4 text-[13px]">Скасувати</Button>
          <Button
            variant="danger"
            fullWidth={false}
            isLoading={isLoading}
            icon={<Trash2 size={14} />}
            onClick={handleDelete}
            className="py-2 px-[14px] text-[13px]"
          >
            Видалити
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Button ─────────────────────────────────────────────────────────────

interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
}

function FilterButton({ icon, label, active, open, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[38px] items-center gap-1.5 rounded-lg border px-3 text-[13px] transition-colors"
      style={{
        borderColor: active || open ? '#1a1a1a' : '#e5e7eb',
        backgroundColor: active ? '#1a1a1a' : 'white',
        color: active ? 'white' : '#1a1a1a',
      }}
    >
      {icon}
      <span>{label}</span>
      <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReceiptsPage() {
  const { logout } = useLogout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { categories: txCategories } = useTransactionCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterYearMonth, setFilterYearMonth] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  // Debounce store search so each keystroke doesn't trigger a request.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Server-side filtering — pass the active filters to the hook so results
  // span the whole dataset, not just the currently loaded page.
  const dateRange = filterYearMonth ? monthToDateRange(filterYearMonth) : {};
  const { receipts, isLoading, error, hasMore, loadMore, updateReceipt, removeReceipt } =
    useReceipts({
      storeName: debouncedSearch || undefined,
      ...dateRange,
      transactionCategoryIds: filterCategoryId ? [filterCategoryId] : undefined,
    });

  const [detailsReceipt, setDetailsReceipt] = useState<ReceiptType | null>(null);
  const [editReceipt, setEditReceipt] = useState<ReceiptType | null>(null);
  const [deleteReceipt, setDeleteReceipt] = useState<ReceiptType | null>(null);
  const [showAddChoice, setShowAddChoice] = useState(false);

  const dateRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Deep-link: open a receipt's details when arriving with ?receiptId=<id>
  // (e.g. when the home screen routes Edit/Delete here). Fetch the full
  // receipt so items are present, then strip the param. The ref guard makes
  // this run exactly once — without it, StrictMode's double-invoke (or the
  // param strip) would race and the modal would never open.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current) return;
    const receiptId = new URLSearchParams(window.location.search).get('receiptId');
    if (!receiptId) return;
    deepLinkHandled.current = true;
    receiptsApi
      .getOne(receiptId)
      .then((r) => setDetailsReceipt(r))
      .catch(() => {})
      .finally(() => window.history.replaceState(null, '', '/receipts'));
  }, []);

  // Static list of the last 12 months — independent of loaded receipts so the
  // date filter offers a full range even before data spanning those months is
  // fetched (server applies the resulting date bounds).
  const availableMonths = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }, []);

  // Day groups, derived from the (already date-desc sorted, server-filtered)
  // receipts array. Sequential grouping — append via "Завантажити ще" naturally
  // extends the last group; nothing is stored in state.
  const dayGroups = useMemo(() => {
    const groups: { key: string; label: string; receipts: ReceiptType[] }[] = [];
    for (const r of receipts) {
      const key = r.receiptDate.slice(0, 10);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.receipts.push(r);
      else groups.push({ key, label: formatGroupLabel(r.receiptDate), receipts: [r] });
    }
    return groups;
  }, [receipts]);

  const handleDelete = async (id: string) => {
    const result = await removeReceipt(id);
    if (!result.error) { setDetailsReceipt(null); setDeleteReceipt(null); }
    return result;
  };

  const hasActiveFilters =
    debouncedSearch.trim() !== '' || filterYearMonth !== null || filterCategoryId !== null;

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setFilterYearMonth(null);
    setFilterCategoryId(null);
  };

  const selectedMonthLabel = filterYearMonth ? formatMonthYear(filterYearMonth) : 'Будь-яка дата';
  const selectedCategoryLabel = filterCategoryId
    ? (txCategories.find((c) => c.id === filterCategoryId)?.name ?? 'Категорія')
    : 'Категорія';

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="flex-1 bg-[#F7F7F7]">
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: 24 }}>
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-[20px] font-medium text-[#1a1a1a]">Чеки</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Історія всіх ваших покупок</p>
          </div>

          {/* Filters row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative" style={{ width: 220 }}>
              <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за магазином..."
                className="h-[38px] w-full rounded-lg border border-[#e5e7eb] bg-white pl-[32px] pr-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              />
            </div>

            {/* Date filter */}
            <div ref={dateRef} className="relative">
              <FilterButton
                icon={<Calendar size={14} />}
                label={selectedMonthLabel}
                active={filterYearMonth !== null}
                open={dateOpen}
                onClick={() => { setDateOpen((v) => !v); setCatOpen(false); }}
              />
              {dateOpen && (
                <div className="absolute left-0 top-11 z-20 w-52 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-md">
                  <button
                    type="button"
                    onClick={() => { setFilterYearMonth(null); setDateOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-[13px] hover:bg-[#F7F7F7] ${filterYearMonth === null ? 'font-medium text-[#1a1a1a]' : 'text-[#6b7280]'}`}
                  >
                    Будь-яка дата
                  </button>
                  {availableMonths.map((ym) => (
                    <button
                      key={ym}
                      type="button"
                      onClick={() => { setFilterYearMonth(ym); setDateOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-[13px] hover:bg-[#F7F7F7] ${filterYearMonth === ym ? 'font-medium text-[#1a1a1a]' : 'text-[#6b7280]'}`}
                    >
                      {formatMonthYear(ym)}
                    </button>
                  ))}
                  {availableMonths.length === 0 && (
                    <p className="px-4 py-3 text-[13px] text-[#9ca3af]">Немає даних</p>
                  )}
                </div>
              )}
            </div>

            {/* Category filter */}
            <div ref={catRef} className="relative">
              <FilterButton
                icon={<Tag size={14} />}
                label={selectedCategoryLabel}
                active={filterCategoryId !== null}
                open={catOpen}
                onClick={() => { setCatOpen((v) => !v); setDateOpen(false); }}
              />
              {catOpen && (
                <div className="absolute left-0 top-11 z-20 w-52 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-md">
                  <button
                    type="button"
                    onClick={() => { setFilterCategoryId(null); setCatOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-[13px] hover:bg-[#F7F7F7] ${filterCategoryId === null ? 'font-medium text-[#1a1a1a]' : 'text-[#6b7280]'}`}
                  >
                    Всі категорії
                  </button>
                  {txCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setFilterCategoryId(c.id); setCatOpen(false); }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] hover:bg-[#F7F7F7] ${filterCategoryId === c.id ? 'font-medium text-[#1a1a1a]' : 'text-[#6b7280]'}`}
                    >
                      <TransactionCategoryBadge category={c} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-[12px] text-[#9ca3af] hover:text-[#1a1a1a]"
              >
                <X size={12} />
                Скинути фільтри
              </button>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-[#FCEBEB] px-3 py-3 text-[#A32D2D]">
              <WifiOff size={16} className="flex-shrink-0" />
              <span className="text-[13px]">
                {error}{' '}
                <button type="button" className="font-medium underline" onClick={() => window.location.reload()}>
                  Оновити
                </button>
              </span>
            </div>
          )}

          {/* Loading — skeleton rows on first load */}
          {isLoading && receipts.length === 0 && (
            <div className="card-surface overflow-hidden rounded-[14px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-t border-[#ECECEF] px-4 py-3 first:border-t-0"
                >
                  <Skeleton className="h-[30px] w-[30px] flex-shrink-0 rounded-full" />
                  <Skeleton className="h-[14px] w-[140px]" />
                  <Skeleton className="h-[20px] w-[96px] rounded-full" />
                  <div className="flex-1" />
                  <Skeleton className="h-[14px] w-[72px]" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state — no receipts at all (no active filters) */}
          {!isLoading && !error && receipts.length === 0 && !hasActiveFilters && (
            <div className="card-surface flex flex-col items-center rounded-[14px] py-16">
              <div
                className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--brand-soft)' }}
              >
                <Receipt size={24} style={{ color: 'var(--brand)' }} />
              </div>
              <h3 className="mb-2 text-[16px] font-medium text-[#1a1a1a]">Тут з&apos;являться ваші чеки</h3>
              <p className="mb-6 max-w-xs text-center text-[14px] text-gray-500">
                Сфотографуйте перший чек — ми розпізнаємо товари й порахуємо все за вас
              </p>
              <Button fullWidth={false} onClick={() => setShowAddChoice(true)}>
                Додати чек
              </Button>
            </div>
          )}

          {/* Table */}
          {!error && receipts.length > 0 && (
            <div className="card-surface overflow-hidden rounded-[14px]">
              {/* Header */}
              <div
                className="grid text-[11px] uppercase tracking-wide text-[#0F6E56]"
                style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px', backgroundColor: 'var(--brand-soft, #E1F5EE)', padding: '10px 16px' }}
              >
                <span>Магазин</span>
                <span>Категорія</span>
                <span>Метод оплати</span>
                <span>Дата</span>
                <span className="text-right">Сума</span>
                <span className="text-right">Дії</span>
              </div>

              {/* Day groups */}
              {dayGroups.map((group) => (
                <div key={group.key}>
                  {/* Group header */}
                  <div
                    className="border-t border-[#e5e7eb] text-[12px] font-medium uppercase tracking-wide"
                    style={{ backgroundColor: '#F7F7F8', color: '#60646C', padding: '6px 16px' }}
                  >
                    {group.label}
                  </div>

                  {/* Rows */}
                  {group.receipts.map((receipt) => {
                    const storeName = receipt.store?.name ?? '—';
                    const storeC = receipt.store
                      ? categoryColor(receipt.store.id)
                      : { bg: '#F0F0F3', text: '#60646C' };
                    return (
                      <div
                        key={receipt.id}
                        className="group grid cursor-pointer items-center border-t border-[#e5e7eb] px-4 py-3 hover:bg-[#FAFAFB]"
                        style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px' }}
                        onClick={() => setDetailsReceipt(receipt)}
                      >
                        {/* Store */}
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-[13px] font-medium"
                            style={{ backgroundColor: storeC.bg, color: storeC.text }}
                          >
                            {storeName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[14px] font-medium text-[#1a1a1a]">{storeName}</span>
                        </div>

                        {/* Transaction Category */}
                        <div>
                          <TransactionCategoryBadge category={receipt.transactionCategory} />
                        </div>

                        {/* Payment Method */}
                        <span className="text-[13px] text-[#6b7280]">
                          {receipt.paymentMethod?.name ?? '—'}
                        </span>

                        {/* Date */}
                        <span className="text-[13px] text-[#6b7280]">{formatShortDate(receipt.receiptDate)}</span>

                        {/* Amount */}
                        <span className="tnum text-right text-[15px] font-semibold text-[#1a1a1a]">
                          {receipt.totalAmount} {receipt.currency}
                        </span>

                        {/* Actions */}
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={() => setEditReceipt(receipt)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]">
                            <Pencil size={13} />
                          </button>
                          <button type="button" onClick={() => setDeleteReceipt(receipt)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#FCEBEB] hover:text-[#A32D2D]">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* No results after filter */}
          {!isLoading && !error && receipts.length === 0 && hasActiveFilters && (
            <div className="flex flex-col items-center rounded-xl border border-[#e5e7eb] bg-white py-12">
              <p className="text-[14px] text-[#9ca3af]">Нічого не знайдено</p>
              <button type="button" onClick={clearFilters} className="mt-3 text-[13px] text-[#1a1a1a] underline hover:opacity-70">
                Скинути фільтри
              </button>
            </div>
          )}

          {/* Pagination */}
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" fullWidth={false} isLoading={isLoading} onClick={loadMore} className="py-2 px-6 text-[13px]">
                Завантажити ще
              </Button>
            </div>
          )}
          {!hasMore && receipts.length > 0 && !isLoading && (
            <p className="mt-4 text-center text-[13px] text-[#9ca3af]">Це всі ваші чеки</p>
          )}
        </div>
      </main>

      {/* Modals */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {detailsReceipt && !editReceipt && !deleteReceipt && (
        <ReceiptDetailsModal
          receipt={detailsReceipt}
          onClose={() => setDetailsReceipt(null)}
          onEdit={() => { setEditReceipt(detailsReceipt); setDetailsReceipt(null); }}
          onDelete={() => { setDeleteReceipt(detailsReceipt); setDetailsReceipt(null); }}
        />
      )}

      {editReceipt && (
        <EditModal receipt={editReceipt} onClose={() => setEditReceipt(null)} onSave={updateReceipt} />
      )}

      {deleteReceipt && (
        <DeleteModal receipt={deleteReceipt} onClose={() => setDeleteReceipt(null)} onDelete={handleDelete} />
      )}

      {showAddChoice && <AddReceiptChoiceModal onClose={() => setShowAddChoice(false)} />}
    </div>
  );
}
