'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { TopNav } from '@/src/components/features/home/TopNav';
import { Button } from '@/src/components/ui/Button';
import { useLogout } from '@/src/hooks/useAuth';
import { useStores } from '@/src/hooks/useStores';
import { usePaymentMethods } from '@/src/hooks/usePaymentMethods';
import { useTransactionCategories } from '@/src/hooks/useTransactionCategories';
import { useItemCategories } from '@/src/hooks/useItemCategories';
import { receiptsApi } from '@/src/api/receipts.api';
import type { ParsedReceiptDto, ParsedItem, CreateReceiptItemDto } from '@/src/types/receipt.types';
import type { ItemCategory } from '@/src/types/item-category.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const UNITS = ['шт', 'кг', 'л', 'м', 'г'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditableItem extends CreateReceiptItemDto {
  _key: string;
}

// ─── Logout Modal ─────────────────────────────────────────────────────────────

interface LogoutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function LogoutModal({ onConfirm, onCancel }: LogoutModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div
        className="w-[400px] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-[18px] font-medium">Вийти з акаунту?</h2>
        <p className="mb-6 text-[14px] text-gray-500">
          Вас буде перенаправлено на стартовий екран. Дані збережуться.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onCancel}>
            Скасувати
          </Button>
          <Button variant="danger" fullWidth={false} onClick={onConfirm}>
            Вийти
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Category Badge ──────────────────────────────────────────────────────

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

// ─── Item Sub-Modal ───────────────────────────────────────────────────────────

interface ItemSubModalProps {
  item: EditableItem | null;
  itemCategories: ItemCategory[];
  onSave: (item: EditableItem) => void;
  onCancel: () => void;
}

function ItemSubModal({ item, itemCategories, onSave, onCancel }: ItemSubModalProps) {
  const [name, setName] = useState(item?.name ?? '');
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? '1');
  const [unit, setUnit] = useState(item?.unit ?? 'шт');
  const [pricePerUnit, setPricePerUnit] = useState(item?.pricePerUnit?.toString() ?? '');
  const [itemCategoryId, setItemCategoryId] = useState<string>(item?.itemCategoryId ?? '');
  const [error, setError] = useState<string | null>(null);

  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(pricePerUnit) || 0;
  const total = Math.round(qty * price * 100) / 100;

  const handleSave = () => {
    if (!name.trim()) { setError('Введіть назву товару'); return; }
    if (qty <= 0) { setError('Кількість має бути більше 0'); return; }
    if (price <= 0) { setError('Ціна має бути більше 0'); return; }
    onSave({
      _key: item?._key ?? crypto.randomUUID(),
      name: name.trim(),
      quantity: qty,
      unit: unit || undefined,
      pricePerUnit: price,
      totalPrice: total,
      itemCategoryId: itemCategoryId || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-[380px] rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-medium">
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

        {error && (
          <p className="mb-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Назва товару</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Кількість</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Одиниця</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Ціна за одиницю</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Категорія</label>
            <select
              value={itemCategoryId}
              onChange={(e) => setItemCategoryId(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            >
              <option value="">Без категорії</option>
              {itemCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {qty > 0 && price > 0 && (
            <p className="text-right text-[12px] text-[#9ca3af]">
              Сума: <span className="font-medium text-[#1a1a1a]">{total} ₴</span>
            </p>
          )}
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

// ─── Items Editor (shared between step 3 and edit modal) ──────────────────────

interface ItemsEditorProps {
  items: EditableItem[];
  itemCategories: ItemCategory[];
  currency: string;
  onChange: (items: EditableItem[]) => void;
}

function ItemsEditor({ items, itemCategories, currency, onChange }: ItemsEditorProps) {
  const [subModalItem, setSubModalItem] = useState<EditableItem | null | 'new'>(null);

  const handleSaveItem = (saved: EditableItem) => {
    const idx = items.findIndex((i) => i._key === saved._key);
    if (idx === -1) {
      onChange([...items, saved]);
    } else {
      const next = [...items];
      next[idx] = saved;
      onChange(next);
    }
    setSubModalItem(null);
  };

  const handleRemove = (key: string) => {
    onChange(items.filter((i) => i._key !== key));
  };

  const itemForSubModal: EditableItem | null =
    subModalItem === 'new' ? null : (subModalItem as EditableItem | null);

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
        {/* Header */}
        <div
          className="grid text-[11px] uppercase tracking-wide text-[#9ca3af]"
          style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 60px 64px', padding: '8px 12px', backgroundColor: '#F7F7F7' }}
        >
          <span>Назва</span>
          <span>Кат.</span>
          <span>К-сть</span>
          <span>Ціна/од</span>
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
              style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 60px 64px', padding: '8px 12px' }}
            >
              <span className="text-[13px] text-[#1a1a1a]">{item.name}</span>
              <span><ItemCategoryBadge name={catName} /></span>
              <span className="text-[13px] text-[#6b7280]">
                {item.quantity}{item.unit ? ` ${item.unit}` : ''}
              </span>
              <span className="text-[13px] text-[#6b7280]">{item.pricePerUnit} {currency}</span>
              <span className="text-right text-[13px] text-[#1a1a1a]">{item.totalPrice} {currency}</span>
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
                  onClick={() => handleRemove(item._key)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#FCEBEB] hover:text-[#A32D2D]"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-[13px] text-[#9ca3af]">Немає товарів</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setSubModalItem('new')}
        className="mt-2 text-[13px] text-[#1a1a1a] underline hover:opacity-70"
      >
        + Додати товар вручну
      </button>

      {subModalItem !== null && (
        <ItemSubModal
          item={itemForSubModal}
          itemCategories={itemCategories}
          onSave={handleSaveItem}
          onCancel={() => setSubModalItem(null)}
        />
      )}
    </>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Фото', 'Деталі', 'Товари', 'Готово'];
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium"
                style={{
                  backgroundColor: done ? '#1a1a1a' : active ? '#1a1a1a' : '#e5e7eb',
                  color: done || active ? '#fff' : '#9ca3af',
                }}
              >
                {done ? <Check size={14} /> : num}
              </div>
              <span className="mt-1 text-[11px] text-[#9ca3af]">{label}</span>
            </div>
            {idx < steps.length - 1 && (
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

// ─── Main Upload Page ─────────────────────────────────────────────────────────

export default function ReceiptUploadPage() {
  const router = useRouter();
  const { logout } = useLogout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { stores } = useStores();
  const { methods } = usePaymentMethods();
  const { categories: txCategories } = useTransactionCategories();
  const { categories: itemCategories } = useItemCategories();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 - parse state
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedReceiptDto | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Step 2 - form
  const [storeId, setStoreId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [transactionCategoryId, setTransactionCategoryId] = useState('');
  const [metaError, setMetaError] = useState<string | null>(null);
  const [waitingForParse, setWaitingForParse] = useState(false);

  // Step 3
  const [items, setItems] = useState<EditableItem[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 4
  const [createdReceiptId, setCreatedReceiptId] = useState<string | null>(null);

  const parsedCurrency = parseResult?.currency ?? 'UAH';
  const computedTotal = items.reduce((s, it) => s + it.totalPrice, 0);
  const totalMismatch =
    parseResult?.totalAmount != null &&
    Math.abs(computedTotal - parseResult.totalAmount) > 0.01;

  // ── File validation & parse kick-off ────────────────────────────────────────

  const handleFileSelect = useCallback(
    (selected: File) => {
      setFileError(null);
      if (!ACCEPTED_TYPES.includes(selected.type)) {
        setFileError('Підтримуються лише JPG, PNG, WebP файли');
        return;
      }
      if (selected.size > MAX_FILE_SIZE) {
        setFileError('Файл занадто великий (максимум 10 МБ)');
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      // start parse immediately
      setIsParsing(true);
      setParseError(null);
      setParseResult(null);
      setStep(2);

      receiptsApi
        .parse(selected)
        .then((result) => {
          setParseResult(result);
          setIsParsing(false);
          // Pre-fill store
          if (result.storeName) {
            const match = stores.find(
              (s) => s.name.toLowerCase() === result.storeName!.toLowerCase(),
            );
            if (match) setStoreId(match.id);
          }
          // Pre-fill items
          if (result.items && result.parseConfidence !== 'failed') {
            setItems(
              result.items.map((pi: ParsedItem) => ({
                _key: crypto.randomUUID(),
                name: pi.name,
                quantity: pi.quantity,
                unit: pi.unit ?? undefined,
                pricePerUnit: pi.pricePerUnit,
                totalPrice: pi.totalPrice,
                itemCategoryId: null,
              })),
            );
          }
        })
        .catch(() => {
          setParseError('Не вдалось розпізнати чек');
          setIsParsing(false);
        });
    },
    [stores],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  };

  // ── Step 2 "Далі" ───────────────────────────────────────────────────────────

  const handleStep2Next = async () => {
    if (!storeId || !paymentMethodId || !transactionCategoryId) {
      setMetaError('Заповніть усі поля');
      return;
    }
    setMetaError(null);
    if (isParsing) {
      setWaitingForParse(true);
      return;
    }
    setStep(3);
  };

  useEffect(() => {
    if (waitingForParse && !isParsing) {
      setWaitingForParse(false);
      if (!storeId || !paymentMethodId || !transactionCategoryId) {
        setMetaError('Заповніть усі поля');
        return;
      }
      setStep(3);
    }
  }, [waitingForParse, isParsing, storeId, paymentMethodId, transactionCategoryId]);

  // ── Step 3 submit ────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setConfirmError(null);
    try {
      const receipt = await receiptsApi.create({
        storeId,
        paymentMethodId,
        transactionCategoryId,
        receiptDate: parseResult?.receiptDate ?? todayDateString(),
        currency: parsedCurrency,
        items: items.map(({ _key: _k, ...rest }) => rest),
      });
      setCreatedReceiptId(receipt.id);
      setStep(4);
    } catch {
      setConfirmError('Помилка збереження чеку. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────────

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setIsParsing(false);
    setParseResult(null);
    setParseError(null);
    setStoreId('');
    setPaymentMethodId('');
    setTransactionCategoryId('');
    setMetaError(null);
    setItems([]);
    setConfirmCancel(false);
    setConfirmError(null);
    setCreatedReceiptId(null);
  };

  // ── helpers ──────────────────────────────────────────────────────────────────

  const selectedStore = stores.find((s) => s.id === storeId);
  const selectedMethod = methods.find((m) => m.id === paymentMethodId);
  const selectedCategory = txCategories.find((c) => c.id === transactionCategoryId);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="flex-1 bg-[#F7F7F7]">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
          <StepIndicator current={step} />

          {/* ── Step 1: File selection ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col items-center">
              <div
                className="flex w-full max-w-lg flex-col items-center rounded-xl px-8 py-12 text-center"
                style={{
                  border: '2px dashed #e5e7eb',
                  borderRadius: 12,
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) handleFileSelect(dropped);
                }}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F7]">
                  <Upload size={24} color="#9ca3af" />
                </div>
                <p className="mb-1 text-[15px] font-medium text-[#1a1a1a]">
                  Перетягніть фото чеку або виберіть файл
                </p>
                <p className="mb-6 text-[13px] text-[#9ca3af]">JPG, PNG — до 10 MB</p>

                {fileError && (
                  <p className="mb-4 w-full rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
                    {fileError}
                  </p>
                )}

                <Button
                  fullWidth={false}
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-6 text-[13px]"
                >
                  Вибрати файл
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Metadata + parse ───────────────────────────────────── */}
          {step === 2 && (
            <div className="flex gap-6">
              {/* Left: image preview */}
              <div className="flex flex-col items-center" style={{ flex: 1 }}>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Фото чеку"
                    className="w-full rounded-xl object-contain"
                    style={{ maxHeight: 400 }}
                  />
                )}
                {isParsing && (
                  <div className="mt-3 flex items-center gap-2 rounded-full bg-[#EAF3DE] px-4 py-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3B6D11] opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#3B6D11]" />
                    </span>
                    <span className="text-[12px] text-[#3B6D11]">Розпізнаємо...</span>
                  </div>
                )}
                {parseError && parseResult?.parseConfidence !== 'failed' && (
                  <div className="mt-3 w-full rounded-md bg-[#FCEBEB] px-3 py-2 text-center text-[13px] text-[#A32D2D]">
                    {parseError}
                  </div>
                )}
                <Button
                  variant="secondary"
                  fullWidth={false}
                  className="mt-4 py-2 px-4 text-[13px]"
                  onClick={() => {
                    resetWizard();
                  }}
                >
                  Змінити фото
                </Button>
              </div>

              {/* Right: form */}
              <div style={{ width: 300, flexShrink: 0 }}>
                <h2 className="mb-4 text-[16px] font-medium">Деталі чеку</h2>

                {metaError && (
                  <p className="mb-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
                    {metaError}
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[12px] text-gray-500">Магазин</label>
                    <select
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      className="h-[38px] w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    >
                      <option value="">Оберіть магазин</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-gray-500">Метод оплати</label>
                    <select
                      value={paymentMethodId}
                      onChange={(e) => setPaymentMethodId(e.target.value)}
                      className="h-[38px] w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    >
                      <option value="">Оберіть метод</option>
                      {methods.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-gray-500">Категорія транзакції</label>
                    <select
                      value={transactionCategoryId}
                      onChange={(e) => setTransactionCategoryId(e.target.value)}
                      className="h-[38px] w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    >
                      <option value="">Оберіть категорію</option>
                      {txCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  fullWidth={false}
                  isLoading={waitingForParse}
                  className="mt-6 w-full py-2 text-[13px]"
                  onClick={handleStep2Next}
                >
                  {waitingForParse ? 'Розпізнаємо чек...' : 'Далі →'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Preview items ──────────────────────────────────────── */}
          {step === 3 && (
            <div>
              {parseResult?.parseConfidence === 'partial' && (
                <div
                  className="mb-4 flex items-start gap-2 rounded-md px-3 py-[10px] text-[13px]"
                  style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}
                >
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  Деякі товари могли не розпізнатись — перевірте список
                </div>
              )}

              {(parseResult?.parseConfidence === 'failed' || parseError) && (
                <div className="mb-4 rounded-md bg-[#FCEBEB] px-3 py-3 text-[13px] text-[#A32D2D]">
                  <p className="font-medium">Не вдалось розпізнати чек</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        if (file) {
                          setIsParsing(true);
                          setParseError(null);
                          receiptsApi
                            .parse(file)
                            .then((res) => {
                              setParseResult(res);
                              setIsParsing(false);
                              if (res.items && res.parseConfidence !== 'failed') {
                                setItems(
                                  res.items.map((pi: ParsedItem) => ({
                                    _key: crypto.randomUUID(),
                                    name: pi.name,
                                    quantity: pi.quantity,
                                    unit: pi.unit ?? undefined,
                                    pricePerUnit: pi.pricePerUnit,
                                    totalPrice: pi.totalPrice,
                                    itemCategoryId: null,
                                  })),
                                );
                              }
                            })
                            .catch(() => {
                              setParseError('Не вдалось розпізнати чек');
                              setIsParsing(false);
                            });
                        }
                      }}
                    >
                      Спробувати ще раз
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        setItems([]);
                        setParseError(null);
                      }}
                    >
                      Ввести вручну
                    </button>
                  </div>
                </div>
              )}

              <ItemsEditor
                items={items}
                itemCategories={itemCategories}
                currency={parsedCurrency}
                onChange={setItems}
              />

              {/* Total */}
              <div className="mt-4 flex items-center justify-end gap-3">
                <span className="text-[13px] text-[#6b7280]">Загальна сума</span>
                <span className="text-[16px] font-medium">
                  {Math.round(computedTotal * 100) / 100} {parsedCurrency}
                </span>
              </div>

              {totalMismatch && (
                <div
                  className="mt-3 rounded-md px-3 py-2 text-[13px]"
                  style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}
                >
                  Сума товарів ({Math.round(computedTotal * 100) / 100} {parsedCurrency}) відрізняється
                  від суми на чеку ({parseResult?.totalAmount} {parsedCurrency})
                </div>
              )}

              {confirmError && (
                <p className="mt-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
                  {confirmError}
                </p>
              )}

              <div className="mt-6 flex justify-between">
                <Button
                  variant="secondary"
                  fullWidth={false}
                  className="py-2 px-6 text-[13px]"
                  onClick={() => setConfirmCancel(true)}
                >
                  Скасувати
                </Button>
                <Button
                  fullWidth={false}
                  isLoading={isSubmitting}
                  disabled={items.length === 0}
                  icon={<CheckCircle2 size={15} />}
                  className="py-2 px-6 text-[13px]"
                  onClick={handleConfirm}
                >
                  Підтвердити
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Success ────────────────────────────────────────────── */}
          {step === 4 && (
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

              {/* Summary chips */}
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
                  {Math.round(computedTotal * 100) / 100} {parsedCurrency}
                </span>
              </div>

              <div className="flex gap-3">
                <Button fullWidth={false} onClick={resetWizard} className="py-2 px-6 text-[13px]">
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

      {/* Cancel confirm dialog */}
      {confirmCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setConfirmCancel(false)}
        >
          <div
            className="w-[360px] rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-[16px] font-medium">Скасувати додавання?</h2>
            <p className="mb-6 text-[13px] text-gray-500">
              Дані будуть втрачені. Продовжити?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" fullWidth={false} onClick={() => setConfirmCancel(false)} className="py-2 px-4 text-[13px]">
                Назад
              </Button>
              <Button variant="danger" fullWidth={false} onClick={resetWizard} className="py-2 px-4 text-[13px]">
                Скасувати
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => {
            setShowLogoutModal(false);
            logout();
          }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}
