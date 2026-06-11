'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Pencil,
  Trash2,
  Check,
  Plus,
  ShoppingBasket,
  AlertTriangle,
} from 'lucide-react';
import { TopNav } from '@/src/components/features/home/TopNav';
import { Button } from '@/src/components/ui/Button';
import { SearchableStoreSelect } from '@/src/components/features/receipts/SearchableStoreSelect';
import { SearchableEntitySelect } from '@/src/components/features/receipts/SearchableEntitySelect';
import { useLogout } from '@/src/hooks/useAuth';
import { useStores } from '@/src/hooks/useStores';
import { usePaymentMethods } from '@/src/hooks/usePaymentMethods';
import { useTransactionCategories } from '@/src/hooks/useTransactionCategories';
import { useItemCategories } from '@/src/hooks/useItemCategories';
import { receiptsApi } from '@/src/api/receipts.api';
import type { CreateReceiptItemDto } from '@/src/types/receipt.types';
import type { ItemCategory } from '@/src/types/item-category.types';

// ─── Constants & helpers ──────────────────────────────────────────────────────

const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'упак'];

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditableItem extends CreateReceiptItemDto {
  _key: string;
}

// ─── Logout Modal ─────────────────────────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-[18px] font-medium">Вийти з акаунту?</h2>
        <p className="mb-6 text-[14px] text-gray-500">
          Вас буде перенаправлено на стартовий екран. Дані збережуться.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onCancel}>Скасувати</Button>
          <Button variant="danger" fullWidth={false} onClick={onConfirm}>Вийти</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Sub-Modal ───────────────────────────────────────────────────────────

interface ItemSubModalProps {
  item: EditableItem | null;
  itemCategories: ItemCategory[];
  onCreateCategory: (name: string) => Promise<ItemCategory | null>;
  onSave: (item: EditableItem) => void;
  onCancel: () => void;
}

function ItemSubModal({ item, itemCategories, onCreateCategory, onSave, onCancel }: ItemSubModalProps) {
  const initialQty = item?.quantity ?? 1;
  const initialPrice = item?.pricePerUnit ?? 0;
  const initialOriginal = item?.originalAmount ?? round2(initialQty * initialPrice);
  const initialDiscount = item?.discountAmount ?? 0;
  const initialAuto = round2(initialQty * initialPrice);

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

  const [nameError, setNameError] = useState<string | null>(null);
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [originalError, setOriginalError] = useState<string | null>(null);

  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(pricePerUnit) || 0;
  const autoOriginal = round2(qty * price);
  const originalAmount = originalAmountRaw === '' ? autoOriginal : parseFloat(originalAmountRaw) || 0;
  const discountAmount = discountAmountRaw === '' ? 0 : Math.max(0, parseFloat(discountAmountRaw) || 0);
  const finalPrice = Math.max(0, round2(originalAmount - discountAmount));
  const showAutoHint = originalManuallyEdited && Math.abs(originalAmount - autoOriginal) > 0.01;
  const discountExceedsOriginal = discountAmount > originalAmount;

  const handleQtyChange = (v: string) => {
    setQuantity(v);
    setQtyError(null);
    if (!originalManuallyEdited) {
      const q = parseFloat(v) || 0;
      const p = parseFloat(pricePerUnit) || 0;
      setOriginalAmountRaw(round2(q * p).toString());
    }
  };

  const handlePriceChange = (v: string) => {
    setPricePerUnit(v);
    setPriceError(null);
    if (!originalManuallyEdited) {
      const q = parseFloat(quantity) || 0;
      const p = parseFloat(v) || 0;
      setOriginalAmountRaw(round2(q * p).toString());
    }
  };

  const handleOriginalChange = (v: string) => {
    setOriginalAmountRaw(v);
    setOriginalManuallyEdited(true);
    setOriginalError(null);
  };

  const resetOriginalToAuto = () => {
    setOriginalAmountRaw(autoOriginal ? autoOriginal.toString() : '');
    setOriginalManuallyEdited(false);
    setOriginalError(null);
  };

  const validate = (): boolean => {
    let ok = true;
    if (!name.trim()) { setNameError('Введіть назву товару'); ok = false; }
    if (qty <= 0) { setQtyError('Значення має бути більше 0'); ok = false; }
    if (price <= 0) { setPriceError('Значення має бути більше 0'); ok = false; }
    if (originalAmount <= 0) { setOriginalError('Значення має бути більше 0'); ok = false; }
    return ok;
  };

  const handleSave = () => {
    setNameError(null);
    setQtyError(null);
    setPriceError(null);
    setOriginalError(null);
    if (!validate()) return;
    onSave({
      _key: item?._key ?? crypto.randomUUID(),
      name: name.trim(),
      quantity: qty,
      unit: unit || undefined,
      pricePerUnit: price,
      originalAmount,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      itemCategoryId: itemCategoryId || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-[380px] max-w-full overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        style={{ maxHeight: 'calc(100vh - 32px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-[#1a1a1a]">
            {item ? 'Редагувати товар' : 'Додати товар'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Назва товару</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              placeholder="Введіть назву..."
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
            {nameError && <p className="mt-1 text-[12px] text-[#A32D2D]">{nameError}</p>}
          </div>

          <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Кількість</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(e) => handleQtyChange(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              />
              {qtyError && <p className="mt-1 text-[12px] text-[#A32D2D]">{qtyError}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Од.</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Ціна ₴</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={pricePerUnit}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              />
              {priceError && <p className="mt-1 text-[12px] text-[#A32D2D]">{priceError}</p>}
            </div>
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
            <input
              type="number"
              min="0"
              step="0.01"
              value={originalAmountRaw}
              onChange={(e) => handleOriginalChange(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
            {originalError && <p className="mt-1 text-[12px] text-[#A32D2D]">{originalError}</p>}
            {!originalManuallyEdited && !originalError && qty > 0 && price > 0 && (
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
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
            {discountExceedsOriginal && (
              <p className="mt-1 text-[11px] text-[#854F0B]">
                Знижка перевищує суму — фінальна сума буде 0
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
            <label className="mb-1 block text-[12px] text-gray-500">Категорія товару</label>
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
          <Button variant="secondary" fullWidth={false} onClick={onCancel} className="py-2 px-4 text-[13px]">
            Скасувати
          </Button>
          <Button fullWidth={false} onClick={handleSave} className="py-2 px-4 text-[13px]">
            Зберегти
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 }) {
  const labels = ['Деталі', 'Товари'];
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {labels.map((label, idx) => {
        const num = idx + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium"
                style={{
                  backgroundColor: done || active ? '#1a1a1a' : '#e5e7eb',
                  color: done || active ? '#fff' : '#9ca3af',
                }}
              >
                {done ? <Check size={14} /> : num}
              </div>
              <span className="mt-1 text-[11px] text-[#9ca3af]">{label}</span>
            </div>
            {idx < labels.length - 1 && (
              <div
                className="mb-4 h-px w-16"
                style={{ backgroundColor: done ? '#1a1a1a' : '#e5e7eb' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManualReceiptPage() {
  const router = useRouter();
  const { logout } = useLogout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { stores, createStore } = useStores();
  const { methods, createMethod } = usePaymentMethods();
  const { categories: txCategories, createCategory: createTxCategory } = useTransactionCategories();
  const { categories: itemCategories, createCategory: createItemCategory } = useItemCategories();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — metadata (all optional)
  const [storeId, setStoreId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [transactionCategoryId, setTransactionCategoryId] = useState<string | null>(null);

  // Step 2 — items + date + manual total
  const [receiptDate, setReceiptDate] = useState<string>(todayDateString());
  const [items, setItems] = useState<EditableItem[]>([]);
  const [manualTotalRaw, setManualTotalRaw] = useState<string>('');
  const [subModalItem, setSubModalItem] = useState<EditableItem | null | 'new'>(null);
  const [showSumMismatch, setShowSumMismatch] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoTotal = round2(
    items.reduce(
      (s, it) => s + Math.max(0, it.originalAmount - (it.discountAmount ?? 0)),
      0,
    ),
  );
  const parsedManualTotal = manualTotalRaw === '' ? null : parseFloat(manualTotalRaw);
  const hasManualOverride =
    parsedManualTotal !== null && !Number.isNaN(parsedManualTotal);
  const effectiveTotal = hasManualOverride ? parsedManualTotal! : autoTotal;
  const totalMismatch =
    hasManualOverride && Math.abs(parsedManualTotal! - autoTotal) > 0.01;

  const hasAnyData =
    storeId !== null ||
    paymentMethodId !== null ||
    transactionCategoryId !== null ||
    items.length > 0 ||
    manualTotalRaw !== '';

  const selectedStore = stores.find((s) => s.id === storeId) ?? null;
  const selectedMethod = methods.find((m) => m.id === paymentMethodId) ?? null;
  const selectedCategory = txCategories.find((c) => c.id === transactionCategoryId) ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveItem = (saved: EditableItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i._key === saved._key);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    setSubModalItem(null);
  };

  const handleRemoveItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i._key !== key));
  };

  const persist = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await receiptsApi.create({
        storeId,
        paymentMethodId,
        transactionCategoryId,
        receiptDate: receiptDate || todayDateString(),
        currency: 'UAH',
        items: items.map(({ _key: _k, ...rest }) => rest),
      });
      setStep(3);
    } catch {
      setSubmitError('Не вдалось зберегти чек. Спробуйте ще раз');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (items.length === 0) return;
    if (totalMismatch) {
      setShowSumMismatch(true);
      return;
    }
    void persist();
  };

  const handleCancel = () => {
    if (hasAnyData) {
      setConfirmCancel(true);
    } else {
      router.push('/receipts');
    }
  };

  const itemForSubModal: EditableItem | null =
    subModalItem === 'new' ? null : (subModalItem as EditableItem | null);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="flex-1 bg-[#F7F7F7]">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 32 }}>
          {step !== 3 && (
            <div className="mb-4">
              <h1 className="text-[18px] font-medium text-[#1a1a1a]">Новий чек — ручне введення</h1>
              <p className="mt-0.5 text-[12px] text-[#9ca3af]">
                Крок {step} з 2 — {step === 1 ? 'заповніть деталі' : 'заповніть товари'}
              </p>
            </div>
          )}

          {step !== 3 && <StepIndicator current={step} />}

          {/* ── Step 1: Metadata ──────────────────────────────────────────── */}
          {step === 1 && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
              <p className="mb-1 text-[15px] font-medium text-[#1a1a1a]">Деталі чеку</p>
              <p className="mb-4 text-[12px] text-[#9ca3af]">Усі поля опціональні</p>

              <div className="space-y-3">
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
              </div>

              <div className="mt-6 flex justify-between">
                <Button
                  variant="secondary"
                  fullWidth={false}
                  className="py-2 px-4 text-[13px]"
                  onClick={handleCancel}
                >
                  Скасувати
                </Button>
                <Button
                  fullWidth={false}
                  className="py-2 px-6 text-[13px]"
                  onClick={() => setStep(2)}
                >
                  Далі →
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Items + Date + Confirm ────────────────────────────── */}
          {step === 2 && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] text-gray-500">Дата покупки</label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="h-[38px] w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] text-gray-500">Магазин</label>
                  <div className="flex h-[38px] items-center rounded-lg border border-[#e5e7eb] bg-[#F7F7F7] px-3 text-[13px] text-[#6b7280]">
                    {selectedStore?.name ?? '—'}
                  </div>
                </div>
              </div>

              <p className="mb-2 text-[12px] uppercase tracking-wide text-[#9ca3af]">Товари</p>

              {items.length === 0 ? (
                <div className="flex flex-col items-center rounded-lg border border-dashed border-[#e5e7eb] py-10">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F7] text-[#9ca3af]">
                    <ShoppingBasket size={18} />
                  </div>
                  <p className="text-[14px] font-medium text-[#1a1a1a]">Додайте перший товар</p>
                  <p className="mb-4 text-[12px] text-gray-500">Введіть назву, кількість та ціну</p>
                  <Button
                    fullWidth={false}
                    icon={<Plus size={14} />}
                    className="py-2 px-4 text-[13px]"
                    onClick={() => setSubModalItem('new')}
                  >
                    Додати товар
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
                  <div
                    className="grid text-[11px] uppercase tracking-wide text-[#0F6E56]"
                    style={{ gridTemplateColumns: '3fr 1.2fr 1fr 1fr 56px', padding: '8px 12px', backgroundColor: 'var(--brand-soft, #E1F5EE)' }}
                  >
                    <span>Назва</span>
                    <span>Категорія</span>
                    <span>К-сть</span>
                    <span className="text-right">Сума</span>
                    <span />
                  </div>
                  {items.map((item) => {
                    const catName = item.itemCategoryId
                      ? itemCategories.find((c) => c.id === item.itemCategoryId)?.name
                      : null;
                    return (
                      <div
                        key={item._key}
                        className="grid items-center border-t border-[#e5e7eb]"
                        style={{ gridTemplateColumns: '3fr 1.2fr 1fr 1fr 56px', padding: '8px 12px' }}
                      >
                        <span className="text-[13px] text-[#1a1a1a]">{item.name}</span>
                        <span className="text-[12px] text-[#6b7280]">{catName ?? 'Без кат.'}</span>
                        <span className="text-[13px] text-[#6b7280]">
                          {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                        </span>
                        <span className="text-right text-[13px] font-medium text-[#1a1a1a]">
                          {(() => {
                            const d = item.discountAmount ?? 0;
                            const final = Math.max(0, round2(item.originalAmount - d));
                            return d > 0 ? (
                              <span className="flex flex-col items-end leading-tight">
                                <span className="text-[10px] text-[#9ca3af] line-through">{item.originalAmount}</span>
                                <span>{final} ₴</span>
                              </span>
                            ) : (
                              <>{final} ₴</>
                            );
                          })()}
                        </span>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSubModalItem(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item._key)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#FCEBEB] hover:text-[#A32D2D]"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSubModalItem('new')}
                    className="flex w-full items-center gap-2 border-t border-[#e5e7eb] px-3 py-2 text-left text-[13px] text-[#6b7280] hover:bg-[#F7F7F7]"
                  >
                    <Plus size={14} />
                    Додати товар
                  </button>
                </div>
              )}

              {/* Manual total override */}
              <div className="mt-4 rounded-lg border border-[#e5e7eb] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] text-[#6b7280]">Сума товарів</span>
                  <span className="text-[14px] text-[#1a1a1a]">{autoTotal} ₴</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-[#1a1a1a]">Загальна сума чеку</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={autoTotal.toString()}
                      value={manualTotalRaw}
                      onChange={(e) => setManualTotalRaw(e.target.value)}
                      className="h-[38px] w-[120px] rounded-lg border border-[#e5e7eb] bg-white px-3 text-right text-[14px] font-medium outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    />
                    <span className="text-[14px] text-[#6b7280]">₴</span>
                  </div>
                </div>
                {hasManualOverride && !totalMismatch && (
                  <p className="mt-2 text-[12px] text-[#9ca3af]">Збігається із сумою товарів</p>
                )}
                {totalMismatch && (
                  <div
                    className="mt-3 flex items-start gap-2 rounded-md px-3 py-[10px] text-[13px]"
                    style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}
                  >
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    Сума чеку відрізняється від суми товарів.
                  </div>
                )}
              </div>

              {submitError && (
                <p className="mt-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
                  {submitError}
                </p>
              )}

              <div className="mt-6 flex justify-between">
                <Button
                  variant="secondary"
                  fullWidth={false}
                  className="py-2 px-4 text-[13px]"
                  onClick={handleCancel}
                >
                  Скасувати
                </Button>
                <Button
                  fullWidth={false}
                  isLoading={isSubmitting}
                  disabled={items.length === 0}
                  icon={<Check size={15} />}
                  className="py-2 px-6 text-[13px]"
                  onClick={handleConfirm}
                >
                  Підтвердити
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ──────────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col items-center py-8">
              <div
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: '#EAF3DE' }}
              >
                <Check size={32} color="#3B6D11" />
              </div>
              <h2 className="mb-2 text-[20px] font-medium">Чек збережено</h2>
              <p className="mb-8 text-[14px] text-[#6b7280]">
                Товари додано до вашої статистики витрат
              </p>

              <div className="mb-8 flex flex-wrap justify-center gap-2">
                {selectedStore && (
                  <span className="rounded-full bg-white px-3 py-1 text-[13px] shadow-sm border border-[#e5e7eb]">
                    {selectedStore.name}
                  </span>
                )}
                {selectedMethod && (
                  <span className="rounded-full bg-white px-3 py-1 text-[13px] shadow-sm border border-[#e5e7eb]">
                    {selectedMethod.name}
                  </span>
                )}
                {selectedCategory && (
                  <span className="rounded-full bg-white px-3 py-1 text-[13px] shadow-sm border border-[#e5e7eb]">
                    {selectedCategory.name}
                  </span>
                )}
                <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[13px] font-medium text-[#3B6D11]">
                  {effectiveTotal} ₴
                </span>
              </div>

              <div className="flex gap-3">
                <Button
                  fullWidth={false}
                  onClick={() => {
                    setStep(1);
                    setStoreId(null);
                    setPaymentMethodId(null);
                    setTransactionCategoryId(null);
                    setReceiptDate(todayDateString());
                    setItems([]);
                    setManualTotalRaw('');
                    setSubmitError(null);
                  }}
                  className="py-2 px-6 text-[13px]"
                >
                  Додати ще чек
                </Button>
                <Button
                  variant="secondary"
                  fullWidth={false}
                  className="py-2 px-6 text-[13px]"
                  onClick={() => router.push('/receipts')}
                >
                  До списку чеків
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sub-modals */}
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

      {showSumMismatch && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowSumMismatch(false)}
        >
          <div className="w-[500px] max-w-[calc(100%-32px)] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-[16px] font-medium text-[#1a1a1a]">Підтвердити збереження?</h3>
            <div
              className="mb-3 flex items-start gap-2 rounded-md px-3 py-[10px] text-[13px]"
              style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}
            >
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              Загальна сума відрізняється від суми товарів.
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: '#F7F7F7' }}>
                <p className="text-[11px] uppercase tracking-wide text-[#9ca3af]">Сума товарів</p>
                <p className="mt-1 text-[15px] font-medium text-[#1a1a1a]">{autoTotal} ₴</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#FCEBEB' }}>
                <p className="text-[11px] uppercase tracking-wide" style={{ color: '#A32D2D' }}>Введена сума</p>
                <p className="mt-1 text-[15px] font-medium" style={{ color: '#A32D2D' }}>
                  {parsedManualTotal ?? 0} ₴
                </p>
              </div>
            </div>
            <p className="mb-5 text-[13px] leading-[1.5] text-gray-500">
              Продовжити зі збереженою сумою {parsedManualTotal} ₴ або повернутись і виправити?
            </p>
            <div className="flex justify-between">
              <Button variant="secondary" fullWidth={false} className="py-2 px-4 text-[13px]" onClick={() => setShowSumMismatch(false)}>
                Повернутись
              </Button>
              <Button
                fullWidth={false}
                icon={<Check size={14} />}
                isLoading={isSubmitting}
                className="py-2 px-4 text-[13px]"
                onClick={() => {
                  setShowSumMismatch(false);
                  void persist();
                }}
              >
                Зберегти з {parsedManualTotal} ₴
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setConfirmCancel(false)}
        >
          <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-[16px] font-medium">Скасувати введення?</h2>
            <p className="mb-6 text-[13px] text-gray-500">
              Дані будуть втрачені. Повернутись до вибору способу додавання?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" fullWidth={false} onClick={() => setConfirmCancel(false)} className="py-2 px-4 text-[13px]">
                Продовжити введення
              </Button>
              <Button variant="danger" fullWidth={false} onClick={() => router.push('/receipts')} className="py-2 px-4 text-[13px]">
                Скасувати
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}
