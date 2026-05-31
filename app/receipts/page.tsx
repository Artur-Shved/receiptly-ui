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

const STORE_COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444'];
function storeColor(name: string): string {
  return STORE_COLORS[name.charCodeAt(0) % STORE_COLORS.length];
}

const CATEGORY_COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#FFEDD5', text: '#C2410C' },
];
function categoryColor(name: string) {
  return CATEGORY_COLORS[name.charCodeAt(0) % CATEGORY_COLORS.length];
}

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

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatMonthYear(ym: string): string {
  const [year, month] = ym.split('-');
  return `${UK_MONTHS_LONG[parseInt(month) - 1]} ${year}`;
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function TransactionCategoryBadge({ name }: { name: string | null | undefined }) {
  if (!name) return <span className="text-[12px] text-[#9ca3af]">—</span>;
  const { bg, text } = categoryColor(name);
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {name}
    </span>
  );
}

function ItemCategoryBadge({ name }: { name: string | null | undefined }) {
  if (!name) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
      >
        Без кат.
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[11px] text-[#6b7280]">
      {name}
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

// ─── Details Modal ─────────────────────────────────────────────────────────────

interface DetailsModalProps {
  receipt: ReceiptType;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DetailsModal({ receipt, onClose, onEdit, onDelete }: DetailsModalProps) {
  const storeName = receipt.store?.name ?? '—';
  const paymentMethodName = receipt.paymentMethod?.name ?? '—';
  const categoryName = receipt.transactionCategory?.name ?? '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div className="w-[640px] max-w-full rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e5e7eb] p-5">
          <div>
            <h2 className="text-[16px] font-medium text-[#1a1a1a]">{storeName} — {formatFullDate(receipt.receiptDate)}</h2>
            <p className="mt-0.5 text-[12px] text-[#9ca3af]">Чек #{receipt.id.slice(0, 8)}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Meta grid */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Магазин', value: storeName },
              { label: 'Дата покупки', value: formatFullDate(receipt.receiptDate) },
              { label: 'Метод оплати', value: paymentMethodName },
              { label: 'Категорія транзакції', value: categoryName },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg p-[10px_12px]" style={{ backgroundColor: '#F7F7F7' }}>
                <p className="text-[11px] uppercase tracking-wide text-[#9ca3af]">{label}</p>
                <p className="mt-0.5 text-[13px] font-medium text-[#1a1a1a]">{value}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          <p className="mb-3 text-[12px] uppercase tracking-wide text-[#9ca3af]">Товари</p>
          <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
            <div
              className="grid text-[11px] uppercase tracking-wide text-[#9ca3af]"
              style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 60px', padding: '8px 12px', backgroundColor: '#F7F7F7' }}
            >
              <span>Назва</span><span>Кат.</span><span>К-сть</span><span>Ціна/од</span>
              <span className="text-right">Сума</span>
            </div>
            {(receipt.items ?? []).length === 0 && (
              <div className="px-4 py-4 text-center text-[13px] text-[#9ca3af]">Немає товарів</div>
            )}
            {(receipt.items ?? []).map((item) => (
              <div
                key={item.id}
                className="grid border-t border-[#e5e7eb]"
                style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 60px', padding: '8px 12px' }}
              >
                <span className="text-[13px] text-[#1a1a1a]">{item.name}</span>
                <span><ItemCategoryBadge name={item.itemCategory?.name} /></span>
                <span className="text-[13px] text-[#6b7280]">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                <span className="text-[13px] text-[#6b7280]">{item.pricePerUnit} {receipt.currency}</span>
                <span className="text-right text-[13px] text-[#1a1a1a]">{item.totalPrice} {receipt.currency}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-end gap-4 border-t border-[#e5e7eb] pt-3">
            <span className="text-[13px] text-[#6b7280]">Загальна сума</span>
            <span className="text-[18px] font-medium">{receipt.totalAmount} {receipt.currency}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] p-5">
          <Button variant="danger" fullWidth={false} icon={<Trash2 size={14} />} className="py-2 px-[14px] text-[13px]" onClick={onDelete}>
            Видалити
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth={false} icon={<Pencil size={14} />} className="py-2 px-[14px] text-[13px]" onClick={onEdit}>
              Редагувати
            </Button>
            <Button fullWidth={false} className="py-2 px-[14px] text-[13px]" onClick={onClose}>
              Закрити
            </Button>
          </div>
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
  const initialTotal = item?.totalPrice ?? Math.round(initialQty * initialPrice * 100) / 100;
  const initialAuto = Math.round(initialQty * initialPrice * 100) / 100;

  const [name, setName] = useState(item?.name ?? '');
  const [quantity, setQuantity] = useState(initialQty.toString());
  const [unit, setUnit] = useState(item?.unit ?? 'шт');
  const [pricePerUnit, setPricePerUnit] = useState(initialPrice ? initialPrice.toString() : '');
  const [totalPriceRaw, setTotalPriceRaw] = useState(initialTotal ? initialTotal.toString() : '');
  const [totalManuallyEdited, setTotalManuallyEdited] = useState(
    item != null && Math.abs(initialTotal - initialAuto) > 0.01,
  );
  const [itemCategoryId, setItemCategoryId] = useState<string>(item?.itemCategoryId ?? '');
  const [error, setError] = useState<string | null>(null);

  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(pricePerUnit) || 0;
  const autoTotal = Math.round(qty * price * 100) / 100;
  const total = totalPriceRaw === '' ? autoTotal : parseFloat(totalPriceRaw) || 0;
  const showAutoHint = totalManuallyEdited && Math.abs(total - autoTotal) > 0.01;

  const handleQtyChange = (v: string) => {
    setQuantity(v);
    if (!totalManuallyEdited) {
      const q = parseFloat(v) || 0;
      const p = parseFloat(pricePerUnit) || 0;
      setTotalPriceRaw((Math.round(q * p * 100) / 100).toString());
    }
  };

  const handlePriceChange = (v: string) => {
    setPricePerUnit(v);
    if (!totalManuallyEdited) {
      const q = parseFloat(quantity) || 0;
      const p = parseFloat(v) || 0;
      setTotalPriceRaw((Math.round(q * p * 100) / 100).toString());
    }
  };

  const handleTotalChange = (v: string) => {
    setTotalPriceRaw(v);
    setTotalManuallyEdited(true);
  };

  const resetTotalToAuto = () => {
    setTotalPriceRaw(autoTotal ? autoTotal.toString() : '');
    setTotalManuallyEdited(false);
  };

  const handleSave = () => {
    if (!name.trim()) { setError('Введіть назву товару'); return; }
    if (qty <= 0) { setError('Кількість має бути більше 0'); return; }
    if (price <= 0) { setError('Ціна має бути більше 0'); return; }
    if (total <= 0) { setError('Сума має бути більше 0'); return; }
    onSave({
      _key: item?._key ?? crypto.randomUUID(),
      name: name.trim(), quantity: qty, unit: unit || undefined,
      pricePerUnit: price, totalPrice: total,
      itemCategoryId: itemCategoryId || null,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onCancel}>
      <div className="w-[380px] rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
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
              <label className="text-[12px] text-gray-500">Сума товару ₴</label>
              {showAutoHint && (
                <button
                  type="button"
                  onClick={resetTotalToAuto}
                  className="text-[11px] text-[#1a1a1a] underline hover:opacity-70"
                >
                  Перерахувати ({autoTotal} ₴)
                </button>
              )}
            </div>
            <input type="number" min="0" step="0.01" value={totalPriceRaw} onChange={(e) => handleTotalChange(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]" />
            {!totalManuallyEdited && qty > 0 && price > 0 && (
              <p className="mt-1 text-[11px] text-[#9ca3af]">
                Автоматично: {autoTotal} ₴ — змініть якщо потрібно
              </p>
            )}
          </div>
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
      totalPrice: it.totalPrice,
      itemCategoryId: it.itemCategoryId,
    })),
  );
  const [subModalItem, setSubModalItem] = useState<EditableItem | null | 'new'>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedTotal = items.reduce((s, it) => s + it.totalPrice, 0);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="w-[640px] max-w-full rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] p-5">
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Редагувати чек</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7]"><X size={16} /></button>
        </div>

        <div className="p-5">
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
            {items.map((item) => (
              <div key={item._key} className="flex items-center gap-3 border-b border-[#e5e7eb] p-3 last:border-b-0">
                <span className="flex-1 text-[13px] text-[#1a1a1a]">{item.name}</span>
                <ItemCategoryBadge name={item.itemCategoryId ? itemCategories.find((c) => c.id === item.itemCategoryId)?.name : null} />
                <span className="text-[13px] text-[#6b7280]">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                <span className="text-[13px] text-[#6b7280]">{item.totalPrice} ₴</span>
                <button type="button" onClick={() => setSubModalItem(item)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"><Pencil size={13} /></button>
                <button type="button" onClick={() => setItems((prev) => prev.filter((i) => i._key !== item._key))} className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#FCEBEB] hover:text-[#A32D2D]"><Trash2 size={13} /></button>
              </div>
            ))}
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

        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] p-5">
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
  const { receipts, isLoading, error, hasMore, loadMore, updateReceipt, removeReceipt } = useReceipts();
  const { categories: txCategories } = useTransactionCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterYearMonth, setFilterYearMonth] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

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

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    receipts.forEach((r) => set.add(r.receiptDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [receipts]);

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      if (searchQuery.trim() && !r.store?.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterYearMonth && !r.receiptDate.startsWith(filterYearMonth)) return false;
      if (filterCategoryId && r.transactionCategoryId !== filterCategoryId) return false;
      return true;
    });
  }, [receipts, searchQuery, filterYearMonth, filterCategoryId]);

  const handleDelete = async (id: string) => {
    const result = await removeReceipt(id);
    if (!result.error) { setDetailsReceipt(null); setDeleteReceipt(null); }
    return result;
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
                      <TransactionCategoryBadge name={c.name} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear filters */}
            {(filterYearMonth || filterCategoryId) && (
              <button
                type="button"
                onClick={() => { setFilterYearMonth(null); setFilterCategoryId(null); }}
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

          {/* Loading */}
          {isLoading && receipts.length === 0 && (
            <div className="flex justify-center py-16 text-[13px] text-gray-500">Завантаження...</div>
          )}

          {/* Empty state */}
          {!isLoading && !error && receipts.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border border-[#e5e7eb] bg-white py-16">
              <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#F7F7F7]">
                <Receipt size={24} color="#9ca3af" />
              </div>
              <h3 className="mb-2 text-[16px] font-medium text-[#1a1a1a]">Жодного чеку</h3>
              <p className="mb-6 max-w-xs text-center text-[14px] text-gray-500">
                Додайте перший чек щоб почати відстежувати витрати
              </p>
              <Button fullWidth={false} onClick={() => setShowAddChoice(true)}>
                Додати чек
              </Button>
            </div>
          )}

          {/* Table */}
          {!error && filtered.length > 0 && (
            <div className="overflow-hidden rounded-lg bg-white" style={{ border: '1px solid #e5e7eb' }}>
              {/* Header */}
              <div
                className="grid text-[11px] uppercase tracking-wide text-[#9ca3af]"
                style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px', backgroundColor: '#F7F7F7', padding: '10px 16px' }}
              >
                <span>Магазин</span>
                <span>Категорія</span>
                <span>Метод оплати</span>
                <span>Дата</span>
                <span className="text-right">Сума</span>
                <span className="text-right">Дії</span>
              </div>

              {/* Rows */}
              {filtered.map((receipt) => {
                const storeName = receipt.store?.name ?? '—';
                const color = storeColor(storeName);
                return (
                  <div
                    key={receipt.id}
                    className="group grid cursor-pointer items-center border-t border-[#e5e7eb] px-4 py-3 hover:bg-[#FAFAFA]"
                    style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px' }}
                    onClick={() => setDetailsReceipt(receipt)}
                  >
                    {/* Store */}
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-[13px] font-medium text-white"
                        style={{ backgroundColor: color }}
                      >
                        {storeName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[14px] font-medium text-[#1a1a1a]">{storeName}</span>
                    </div>

                    {/* Transaction Category */}
                    <div>
                      <TransactionCategoryBadge name={receipt.transactionCategory?.name} />
                    </div>

                    {/* Payment Method */}
                    <span className="text-[13px] text-[#6b7280]">
                      {receipt.paymentMethod?.name ?? '—'}
                    </span>

                    {/* Date */}
                    <span className="text-[13px] text-[#6b7280]">{formatShortDate(receipt.receiptDate)}</span>

                    {/* Amount */}
                    <span className="text-right text-[14px] font-medium text-[#1a1a1a]">
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
          )}

          {/* No results after filter */}
          {!error && receipts.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border border-[#e5e7eb] bg-white py-12">
              <p className="text-[14px] text-[#9ca3af]">Нічого не знайдено</p>
              <button type="button" onClick={() => { setSearchQuery(''); setFilterYearMonth(null); setFilterCategoryId(null); }} className="mt-3 text-[13px] text-[#1a1a1a] underline hover:opacity-70">
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
          {!hasMore && filtered.length > 0 && !isLoading && (
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
        <DetailsModal
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
