'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Check,
  Plus,
  Camera,
  Info,
  ScanEye,
  RefreshCw,
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
import { extractPdfPagesAsImages } from '@/src/lib/pdf-to-images';
import type { ParsedReceiptDto, ParsedItem, CreateReceiptItemDto } from '@/src/types/receipt.types';
import type { ItemCategory } from '@/src/types/item-category.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PDF_TYPE = 'application/pdf';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PHOTOS = 10;
const UNITS = ['шт', 'кг', 'л', 'м', 'г'];

type PhotoStatus = 'waiting' | 'processing' | 'done' | 'error';

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  status: PhotoStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditableItem extends CreateReceiptItemDto {
  _key: string;
  photoIndex?: number;
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
  onCreateCategory: (name: string) => Promise<ItemCategory | null>;
  onSave: (item: EditableItem) => void;
  onCancel: () => void;
}

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
                onChange={(e) => handleQtyChange(e.target.value)}
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
              onChange={(e) => handlePriceChange(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
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
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalPriceRaw}
              onChange={(e) => handleTotalChange(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
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
  onCreateCategory: (name: string) => Promise<ItemCategory | null>;
  currency: string;
  onChange: (items: EditableItem[]) => void;
  conflictNames?: Set<string>;
}

function ItemsEditor({ items, itemCategories, onCreateCategory, currency, onChange, conflictNames }: ItemsEditorProps) {
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
              <span className="flex items-center gap-2 text-[13px] text-[#1a1a1a]">
                {item.name}
                {conflictNames?.has(item.name.trim().toLowerCase()) && item.photoIndex !== undefined && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: '#EAF3DE', color: '#27500A' }}
                  >
                    з фото {item.photoIndex + 1}
                  </span>
                )}
              </span>
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
          onCreateCategory={onCreateCategory}
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

  const { stores, createStore } = useStores();
  const { methods, createMethod } = usePaymentMethods();
  const { categories: txCategories, createCategory: createTxCategory } = useTransactionCategories();
  const { categories: itemCategories, createCategory: createItemCategory } = useItemCategories();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 — photo list
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — parse state
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedReceiptDto | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Step 2 — meta form (all optional)
  const [storeId, setStoreId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [transactionCategoryId, setTransactionCategoryId] = useState<string | null>(null);
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

  // ── Photo list management ────────────────────────────────────────────────

  /** Appends a single image file to the photos list with all validation. */
  const appendImageFile = (
    next: PhotoItem[],
    f: File,
    pushError: (msg: string) => void,
  ): PhotoItem[] => {
    if (f.size > MAX_FILE_SIZE) {
      pushError('Файл занадто великий. Максимум 10 MB.');
      return next;
    }
    if (next.length >= MAX_PHOTOS) {
      pushError('Максимум 10 фотографій для одного чеку');
      return next;
    }
    return [
      ...next,
      { id: crypto.randomUUID(), file: f, previewUrl: URL.createObjectURL(f), status: 'waiting' },
    ];
  };

  const addPhotos = useCallback(
    async (selected: FileList | File[]) => {
      setFileError(null);
      const incoming = Array.from(selected);
      if (incoming.length === 0) return;

      // Process inputs sequentially so PDF expansion respects the running
      // photo count and the order matches the user's pick order.
      let next: PhotoItem[] = [...photos];
      let pendingError: string | null = null;
      const pushError = (msg: string) => { pendingError = msg; };

      for (const f of incoming) {
        if (f.type === PDF_TYPE) {
          if (f.size > MAX_FILE_SIZE) { pushError('PDF занадто великий. Максимум 10 MB.'); continue; }
          const slotsLeft = MAX_PHOTOS - next.length;
          if (slotsLeft <= 0) { pushError('Максимум 10 фотографій для одного чеку'); break; }
          try {
            setIsProcessingPdf(true);
            const { files: pages, truncated } = await extractPdfPagesAsImages(f, {
              maxPages: slotsLeft,
            });
            for (const pageFile of pages) {
              next = appendImageFile(next, pageFile, pushError);
            }
            if (truncated) {
              pushError(`PDF більше 10 сторінок — додано перші ${pages.length}`);
            }
          } catch (err) {
            console.error('PDF parse error', err);
            pushError('Не вдалось прочитати PDF. Спробуйте інший файл.');
          } finally {
            setIsProcessingPdf(false);
          }
          continue;
        }
        if (!ACCEPTED_TYPES.includes(f.type)) {
          pushError('Підтримуються JPG, PNG, WebP, PDF файли');
          continue;
        }
        next = appendImageFile(next, f, pushError);
      }

      setPhotos(next);
      if (pendingError) setFileError(pendingError);
    },
    [photos],
  );

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
    setFileError(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const list = e.target.files;
      e.target.value = '';
      void addPhotos(list);
    }
  };

  const handleStep1Next = useCallback(() => {
    if (photos.length === 0) return;
    setPhotos((prev) => prev.map((p) => ({ ...p, status: 'processing' })));
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);
    setStep(2);

    receiptsApi
      .parse(photos.map((p) => p.file))
      .then((result) => {
        setParseResult(result);
        setIsParsing(false);
        const failed = new Set(result.meta?.failedIndices ?? []);
        setPhotos((prev) =>
          prev.map((p, idx) => ({
            ...p,
            status: failed.has(idx) ? 'error' : 'done',
          })),
        );
        if (result.storeName) {
          const match = stores.find(
            (s) => s.name.toLowerCase() === result.storeName!.toLowerCase(),
          );
          if (match) setStoreId(match.id);
        }
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
              photoIndex: pi.photoIndex,
            })),
          );
        }
      })
      .catch(() => {
        setParseError('Не вдалось розпізнати чек');
        setIsParsing(false);
        setPhotos((prev) => prev.map((p) => ({ ...p, status: 'error' })));
      });
  }, [photos, stores]);

  // ── Step 2 "Далі" ───────────────────────────────────────────────────────────

  const handleStep2Next = () => {
    if (isParsing) {
      setWaitingForParse(true);
      return;
    }
    setStep(3);
  };

  useEffect(() => {
    if (waitingForParse && !isParsing) {
      setWaitingForParse(false);
      setStep(3);
    }
  }, [waitingForParse, isParsing]);

  // ── Step 3 submit ────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setConfirmError(null);
    try {
      const receipt = await receiptsApi.create({
        storeId: storeId,
        paymentMethodId: paymentMethodId,
        transactionCategoryId: transactionCategoryId,
        receiptDate: parseResult?.receiptDate ?? todayDateString(),
        currency: parsedCurrency,
        items: items.map(({ _key: _k, photoIndex: _p, ...rest }) => rest),
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
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setFileError(null);
    setIsParsing(false);
    setParseResult(null);
    setParseError(null);
    setStoreId(null);
    setPaymentMethodId(null);
    setTransactionCategoryId(null);
    setItems([]);
    setConfirmCancel(false);
    setConfirmError(null);
    setCreatedReceiptId(null);
  };

  // ── Conflict lookup for badges ────────────────────────────────────────────
  const conflictNames = useMemo(() => {
    const meta = parseResult?.meta;
    if (!meta || meta.priceConflicts.length === 0) return new Set<string>();
    return new Set(meta.priceConflicts.map((c) => c.name.trim().toLowerCase()));
  }, [parseResult]);

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

          {/* ── Step 1: Photo list ──────────────────────────────────────────── */}
          {step === 1 && (
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[16px] font-medium text-[#1a1a1a]">Фотографії чеку</h2>
                <p className="text-[12px] text-[#9ca3af]">
                  Додані фото ({photos.length} / {MAX_PHOTOS})
                </p>
              </div>

              <div
                className="space-y-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) void addPhotos(e.dataTransfer.files);
                }}
              >
                {photos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg bg-white px-3 py-[10px]"
                    style={{ border: '0.5px solid #e5e7eb' }}
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-[#1a1a1a]">
                      <img
                        src={p.previewUrl}
                        alt={`Фото ${idx + 1}`}
                        className="h-full w-full object-cover opacity-90"
                      />
                      <span
                        className="absolute left-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-medium"
                        style={{ backgroundColor: '#1a1a1a', color: '#fff' }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                        Фото {idx + 1}
                      </p>
                      <p className="text-[12px] text-[#9ca3af]">
                        {(p.file.size / (1024 * 1024)).toFixed(2)} MB · {p.file.type.split('/')[1]?.toUpperCase()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#FCEBEB] hover:text-[#A32D2D]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {photos.length < MAX_PHOTOS ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-[10px] text-left hover:bg-[#F7F7F7]"
                    style={{ border: '0.5px dashed #e5e7eb' }}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[#F7F7F7] text-[#6b7280]">
                      <Camera size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] text-[#1a1a1a]">Додати ще фото</p>
                      <p className="text-[12px] text-[#9ca3af]">
                        Сфотографувати або вибрати з галереї
                      </p>
                    </div>
                    <span className="text-[12px] text-[#9ca3af]">
                      {MAX_PHOTOS - photos.length} залишилось
                    </span>
                  </button>
                ) : (
                  <div className="rounded-lg px-3 py-[10px]" style={{ border: '0.5px solid #FAEEDA', backgroundColor: '#FAEEDA', color: '#633806' }}>
                    <span className="text-[12px] font-medium">Максимум 10</span>
                    <span className="ml-2 text-[12px]">
                      Видаліть зайве фото, щоб додати нове.
                    </span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />

              {isProcessingPdf && (
                <p className="mt-3 rounded-md bg-[#E6F1FB] px-3 py-2 text-[13px] text-[#0C447C]">
                  Обробляємо PDF — кожна сторінка стане окремим фото...
                </p>
              )}

              {fileError && (
                <p className="mt-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
                  {fileError}
                </p>
              )}

              <div className="mt-6 flex items-center justify-between">
                <p className="text-[12px] text-[#9ca3af]">
                  JPG / PNG / WebP / PDF · порядок впливає на дедуплікацію
                </p>
                <Button
                  fullWidth={false}
                  disabled={photos.length === 0 || isProcessingPdf}
                  className="py-2 px-6 text-[13px]"
                  onClick={handleStep1Next}
                >
                  Далі →
                </Button>
              </div>
              {photos.length === 0 && (
                <p className="mt-2 text-right text-[12px] text-[#9ca3af]">Додайте хоча б одне фото</p>
              )}
            </div>
          )}

          {/* ── Step 2: Progress + Metadata ─────────────────────────────────── */}
          {step === 2 && (
            <div className="flex gap-6">
              {/* Left: progress card */}
              <div style={{ flex: 1 }}>
                <div className="rounded-xl p-4" style={{ border: '0.5px solid #e5e7eb', backgroundColor: '#F7F7F7' }}>
                  <div className="mb-3 flex items-center gap-2">
                    {isParsing ? (
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1a1a1a] opacity-50" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#1a1a1a]" />
                      </span>
                    ) : (
                      <Check size={14} color="#3B6D11" />
                    )}
                    <span className="text-[13px] font-medium text-[#1a1a1a]">
                      {isParsing
                        ? `Обробка фото (${photos.filter((p) => p.status === 'processing').length} з ${photos.length})...`
                        : 'Обробку завершено'}
                    </span>
                  </div>
                  <div className="mb-4 h-[3px] w-full overflow-hidden rounded-full bg-[#e5e7eb]">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${
                          photos.length === 0
                            ? 0
                            : (photos.filter((p) => p.status === 'done' || p.status === 'error').length / photos.length) * 100
                        }%`,
                        backgroundColor: '#1a1a1a',
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    {photos.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-2.5">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium"
                          style={{ backgroundColor: '#1a1a1a', color: '#fff' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-[12px] text-[#6b7280]">Фото {idx + 1}</span>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                p.status === 'done'
                                  ? '#3B6D11'
                                  : p.status === 'error'
                                    ? '#A32D2D'
                                    : p.status === 'processing'
                                      ? '#F59E0B'
                                      : '#9ca3af',
                              animation: p.status === 'processing' ? 'pulse 1.2s ease-in-out infinite' : undefined,
                            }}
                          />
                          <span
                            className="text-[12px]"
                            style={{
                              color:
                                p.status === 'done'
                                  ? '#3B6D11'
                                  : p.status === 'error'
                                    ? '#A32D2D'
                                    : '#6b7280',
                            }}
                          >
                            {p.status === 'done'
                              ? 'Розпізнано'
                              : p.status === 'error'
                                ? 'Помилка'
                                : p.status === 'processing'
                                  ? 'Обробляється...'
                                  : 'Очікує'}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {parseError && parseResult?.parseConfidence !== 'failed' && (
                  <div className="mt-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-center text-[13px] text-[#A32D2D]">
                    {parseError}
                  </div>
                )}

                <Button
                  variant="secondary"
                  fullWidth={false}
                  className="mt-4 py-2 px-4 text-[13px]"
                  onClick={resetWizard}
                >
                  Змінити фото
                </Button>
              </div>

              {/* Right: form */}
              <div style={{ width: 300, flexShrink: 0 }}>
                <h2 className="mb-1 text-[16px] font-medium">Деталі чеку</h2>
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
                      placeholder="Оберіть або введіть"
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
                      placeholder="Оберіть або введіть"
                      createOptionLabel={(q) => `Додати «${q}» як нову категорію`}
                    />
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
              {/* All-failed: full error state */}
              {(parseResult?.parseConfidence === 'failed' || (parseError && parseResult?.meta?.photosSucceeded === 0)) ? (
                <div className="mx-auto flex max-w-md flex-col items-center rounded-xl bg-white p-8 text-center" style={{ border: '0.5px solid #e5e7eb' }}>
                  <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full" style={{ backgroundColor: '#FCEBEB', color: '#A32D2D' }}>
                    <ScanEye size={24} />
                  </div>
                  <p className="mb-2 text-[15px] font-medium text-[#1a1a1a]">Не вдалось розпізнати чек</p>
                  <p className="mb-6 text-[13px] leading-[1.5] text-[#6b7280]">
                    {parseResult?.meta
                      ? `Жодне з ${parseResult.meta.photosTotal} фото не вдалось розпізнати.`
                      : 'Спробуйте зробити чіткіші знімки або введіть дані вручну.'}
                  </p>
                  <Button
                    fullWidth
                    icon={<RefreshCw size={14} />}
                    className="mb-2 py-2 text-[13px]"
                    onClick={handleStep1Next}
                  >
                    Спробувати ще раз
                  </Button>
                  <Button
                    fullWidth
                    variant="secondary"
                    icon={<Pencil size={14} />}
                    className="py-2 text-[13px]"
                    onClick={() => router.push('/receipts/upload/manual')}
                  >
                    Ввести вручну
                  </Button>
                  <button
                    type="button"
                    onClick={() => router.push('/receipts')}
                    className="mt-4 text-[12px] text-[#9ca3af] hover:underline"
                  >
                    Скасувати
                  </button>
                </div>
              ) : (
              <>
              {/* Partial: some photos failed */}
              {parseResult?.meta && parseResult.meta.photosFailed > 0 && parseResult.meta.photosSucceeded > 0 && (
                <div
                  className="mb-3 flex items-start gap-2 rounded-md px-3 py-[10px] text-[13px]"
                  style={{ backgroundColor: '#FCEBEB', color: '#A32D2D' }}
                >
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Не вдалось розпізнати фото {parseResult.meta.failedIndices.map((i) => i + 1).join(', ')}. Товари з нього не додані до списку.
                  </span>
                </div>
              )}

              {/* Dedup: info if duplicates without price conflicts */}
              {parseResult?.meta && parseResult.meta.duplicatesRemoved > 0 && !parseResult.meta.hasPriceConflicts && (
                <div
                  className="mb-3 flex items-start gap-2 rounded-md px-3 py-[10px] text-[13px]"
                  style={{ backgroundColor: '#E6F1FB', color: '#0C447C' }}
                >
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  Знайдено та видалено {parseResult.meta.duplicatesRemoved} дублікат(ів). Якщо товари видалено помилково — додайте їх вручну.
                </div>
              )}

              {/* Dedup: warning if duplicates with price conflicts */}
              {parseResult?.meta && parseResult.meta.hasPriceConflicts && (
                <div
                  className="mb-3 flex items-start gap-2 rounded-md px-3 py-[10px] text-[13px]"
                  style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}
                >
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  Знайдено товари з однаковою назвою але різною ціною — перевірте список і виправте якщо потрібно.
                </div>
              )}

              {/* Conflict detail cards */}
              {parseResult?.meta?.priceConflicts.map((c, idx) => (
                <div
                  key={`${c.name}-${idx}`}
                  className="mb-3 rounded-lg p-3"
                  style={{ backgroundColor: '#F7F7F7' }}
                >
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-[#9ca3af]">Конфлікт дедуплікації</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-white p-2" style={{ border: '0.5px solid #3B6D11' }}>
                      <p className="text-[11px] font-medium" style={{ color: '#3B6D11' }}>
                        Збережено (фото {c.saved.photoIndex + 1})
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#1a1a1a]">
                        {c.name} · {c.saved.pricePerUnit} ₴
                      </p>
                    </div>
                    <div className="rounded-md bg-white p-2 opacity-60" style={{ border: '0.5px solid #e5e7eb' }}>
                      <p className="text-[11px] text-[#9ca3af]">Видалено (фото {c.removed.photoIndex + 1})</p>
                      <p className="mt-0.5 text-[13px] text-[#1a1a1a]">
                        {c.name} · {c.removed.pricePerUnit} ₴
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Partial confidence (legacy banner — show when parseError but not full failure) */}
              {parseError && parseResult?.meta?.photosSucceeded !== 0 && (
                <div
                  className="mb-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]"
                >
                  {parseError}
                </div>
              )}

              <ItemsEditor
                items={items}
                itemCategories={itemCategories}
                onCreateCategory={async (name) => {
                  const { category } = await createItemCategory(name);
                  return category ?? null;
                }}
                currency={parsedCurrency}
                onChange={setItems}
                conflictNames={conflictNames}
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
              </>
              )}
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
