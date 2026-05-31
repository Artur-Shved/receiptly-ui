'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  QrCode,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  ArrowRight,
  Check,
  Loader2,
  Pencil,
  ScanEye,
  ServerOff,
  Plus,
  Trash2,
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
import { ApiError } from '@/src/types/api.types';
import type {
  ParsedItem,
  ParsedReceiptDto,
  CreateReceiptItemDto,
} from '@/src/types/receipt.types';
import type { ItemCategory } from '@/src/types/item-category.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'упак'];

type Step = 'upload' | 'confirm' | 'processing' | 'preview' | 'success';
type ErrorCode =
  | 'QR_NOT_FOUND'
  | 'QR_INVALID_PARAMS'
  | 'QR_NOT_FISCAL'
  | 'DPS_UNAVAILABLE'
  | 'DPS_NOT_FOUND'
  | 'DPS_PARSE_FAILED'
  | 'NETWORK_ERROR'
  | 'GENERIC';

const ERROR_TEXT: Record<ErrorCode, { title: string; sub: string; icon: 'qr' | 'server' }> = {
  QR_NOT_FOUND: {
    title: 'QR-код не знайдено',
    sub: 'QR-код не знайдено або нечитабельний. Переконайтесь що QR-код повністю в кадрі та фото чітке.',
    icon: 'qr',
  },
  QR_INVALID_PARAMS: {
    title: 'Невалідний QR-код',
    sub: 'Невалідний QR-код фіскального чеку. Переконайтесь що скануєте QR-код з фіскального чеку.',
    icon: 'qr',
  },
  QR_NOT_FISCAL: {
    title: 'Не фіскальний QR-код',
    sub: 'Невалідний QR-код фіскального чеку. Переконайтесь що скануєте QR-код з фіскального чеку, а не звичайного.',
    icon: 'qr',
  },
  DPS_UNAVAILABLE: {
    title: 'Сервіс ДПС недоступний',
    sub: 'Сервіс ДПС тимчасово недоступний. Спробуйте пізніше або скористайтесь іншим способом.',
    icon: 'server',
  },
  DPS_NOT_FOUND: {
    title: 'Чек не знайдено',
    sub: 'Чек не знайдено в реєстрі ДПС. Можливо, чек ще не зареєстровано або QR-код з іншого джерела.',
    icon: 'server',
  },
  DPS_PARSE_FAILED: {
    title: 'Не вдалось розпізнати',
    sub: 'Не вдалось розпізнати дані чеку. Помилку зафіксовано — ми розберемось.',
    icon: 'server',
  },
  NETWORK_ERROR: {
    title: 'Помилка мережі',
    sub: 'Перевірте підключення до інтернету.',
    icon: 'server',
  },
  GENERIC: {
    title: 'Помилка',
    sub: 'Щось пішло не так. Спробуйте ще раз.',
    icon: 'server',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

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

// ─── DPS Badge ────────────────────────────────────────────────────────────────

function DpsBadge() {
  return (
    <span
      className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: '#E6F1FB', color: '#0C447C' }}
    >
      ДПС
    </span>
  );
}

// ─── ItemSubModal (compact) ───────────────────────────────────────────────────

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
  const discountExceedsOriginal = discountAmount > originalAmount;

  const handleQty = (v: string) => {
    setQuantity(v);
    if (!originalManuallyEdited) {
      const q = parseFloat(v) || 0;
      const p = parseFloat(pricePerUnit) || 0;
      setOriginalAmountRaw((Math.round(q * p * 100) / 100).toString());
    }
  };
  const handlePrice = (v: string) => {
    setPricePerUnit(v);
    if (!originalManuallyEdited) {
      const q = parseFloat(quantity) || 0;
      const p = parseFloat(v) || 0;
      setOriginalAmountRaw((Math.round(q * p * 100) / 100).toString());
    }
  };

  const handleSave = () => {
    if (!name.trim()) { setError('Введіть назву товару'); return; }
    if (qty <= 0) { setError('Кількість має бути більше 0'); return; }
    if (price <= 0) { setError('Ціна має бути більше 0'); return; }
    if (originalAmount <= 0) { setError('Сума має бути більше 0'); return; }
    onSave({
      _key: item?._key ?? crypto.randomUUID(),
      name: name.trim(),
      quantity: qty, unit: unit || undefined,
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
          <h3 className="text-[15px] font-medium">{item ? 'Редагувати товар' : 'Додати товар'}</h3>
          <button type="button" onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7]"><X size={15} /></button>
        </div>
        {error && <p className="mb-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Назва</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]" />
          </div>
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">К-сть</label>
              <input type="number" min="0" step="0.001" value={quantity} onChange={(e) => handleQty(e.target.value)} className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Од.</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-gray-500">Ціна ₴</label>
              <input type="number" min="0" step="0.01" value={pricePerUnit} onChange={(e) => handlePrice(e.target.value)} className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-gray-500">Сума без знижки ₴</label>
            <input
              type="number" min="0" step="0.01"
              value={originalAmountRaw}
              onChange={(e) => { setOriginalAmountRaw(e.target.value); setOriginalManuallyEdited(true); }}
              className="h-[38px] w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
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
              <p className="mt-1 text-[11px] text-[#854F0B]">Знижка перевищує суму — фінальна сума буде 0</p>
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
          <Button variant="secondary" fullWidth={false} onClick={onCancel} className="py-2 px-4 text-[13px]">Скасувати</Button>
          <Button fullWidth={false} onClick={handleSave} className="py-2 px-4 text-[13px]">Зберегти</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Processing stages ────────────────────────────────────────────────────────

type StageStatus = 'wait' | 'active' | 'done' | 'error';

interface StageDef {
  key: 'decode' | 'fetch' | 'parse';
  title: string;
  sub: string;
}
const STAGES: StageDef[] = [
  { key: 'decode', title: 'Декодування QR-коду', sub: 'Зчитування фіскального номеру' },
  { key: 'fetch', title: 'Запит до реєстру ДПС', sub: 'cabinet.tax.gov.ua' },
  { key: 'parse', title: 'Розпізнавання даних', sub: 'Товари, ціни, сума' },
];

function ProcessingStages({ activeIdx, errorIdx }: { activeIdx: number; errorIdx: number | null }) {
  return (
    <div className="space-y-0">
      {STAGES.map((s, idx) => {
        let status: StageStatus = 'wait';
        if (errorIdx !== null && idx === errorIdx) status = 'error';
        else if (errorIdx !== null && idx < errorIdx) status = 'done';
        else if (errorIdx === null) {
          if (idx < activeIdx) status = 'done';
          else if (idx === activeIdx) status = 'active';
        }
        const bg = status === 'done' ? '#EAF3DE' : status === 'error' ? '#FCEBEB' : status === 'active' ? '#E6F1FB' : '#F7F7F7';
        const color = status === 'done' ? '#3B6D11' : status === 'error' ? '#A32D2D' : status === 'active' ? '#185FA5' : '#9ca3af';
        const statusText = status === 'done' ? 'Готово' : status === 'active' ? 'Завантаження...' : status === 'error' ? 'Помилка' : 'Очікує';
        return (
          <div key={s.key} className="flex items-center gap-3 border-b border-[#e5e7eb] py-2.5 last:border-b-0">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg, color }}>
              {status === 'done' ? <Check size={14} /> : status === 'error' ? <X size={14} /> : status === 'active' ? <Loader2 size={14} className="animate-spin" /> : <span className="text-[10px]">{idx + 1}</span>}
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-[#1a1a1a]">{s.title}</p>
              <p className="text-[12px] text-[#9ca3af]">{s.sub}</p>
            </div>
            <span className="text-[12px]" style={{ color }}>{statusText}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QrUploadPage() {
  const router = useRouter();
  const { logout } = useLogout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { stores, createStore } = useStores();
  const { methods, createMethod } = usePaymentMethods();
  const { categories: txCategories, createCategory: createTxCategory } = useTransactionCategories();
  const { categories: itemCategories, createCategory: createItemCategory } = useItemCategories();

  const [step, setStep] = useState<Step>('upload');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parseResult, setParseResult] = useState<ParsedReceiptDto | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [stageErrorIdx, setStageErrorIdx] = useState<number | null>(null);

  // Preview meta
  const [storeId, setStoreId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [transactionCategoryId, setTransactionCategoryId] = useState<string | null>(null);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [subModalItem, setSubModalItem] = useState<EditableItem | null | 'new'>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── File selection ───────────────────────────────────────────────────────

  const handleFileSelect = (selected: File) => {
    setFileError(null);
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError('Підтримуються формати: JPG, PNG, WEBP');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError('Файл занадто великий. Максимум 10 MB.');
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setStep('confirm');
  };

  // ── Processing ───────────────────────────────────────────────────────────

  const startProcessing = async () => {
    if (!file) return;
    setStep('processing');
    setStageIdx(0);
    setStageErrorIdx(null);
    setErrorCode(null);

    // Simulated stage progression so the user sees movement while the
    // single BE call orchestrates decode→fetch→parse server-side.
    const stageTimer = setInterval(() => {
      setStageIdx((idx) => (idx < STAGES.length - 1 ? idx + 1 : idx));
    }, 2200);

    try {
      const result = await receiptsApi.parseFromQrImage(file);
      clearInterval(stageTimer);
      setStageIdx(STAGES.length); // all done
      setParseResult(result);

      // Map LLM categories from items if any (DPS doesn't supply categories).
      setItems(
        (result.items ?? []).map((pi: ParsedItem) => ({
          _key: crypto.randomUUID(),
          name: pi.name,
          quantity: pi.quantity,
          unit: pi.unit ?? undefined,
          pricePerUnit: pi.pricePerUnit,
          originalAmount: pi.originalAmount,
          discountAmount: pi.discountAmount,
          itemCategoryId: null,
        })),
      );

      // Try to auto-select an existing store from the parsed name
      if (result.storeName) {
        const match = stores.find(
          (s) => s.name.toLowerCase() === result.storeName!.toLowerCase(),
        );
        if (match) setStoreId(match.id);
      }

      setStep('preview');
    } catch (err) {
      clearInterval(stageTimer);
      const code = extractErrorCode(err);
      // Pick which stage to mark errored based on the code.
      const errorStage =
        code === 'QR_NOT_FOUND' || code === 'QR_INVALID_PARAMS' || code === 'QR_NOT_FISCAL'
          ? 0
          : code === 'DPS_UNAVAILABLE' || code === 'DPS_NOT_FOUND' || code === 'NETWORK_ERROR'
            ? 1
            : 2;
      setStageErrorIdx(errorStage);
      setErrorCode(code);
    }
  };

  // ── Preview submit ───────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!paymentMethodId || !transactionCategoryId) {
      setShowFieldErrors(true);
      return;
    }
    if (items.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await receiptsApi.create({
        storeId,
        paymentMethodId,
        transactionCategoryId,
        receiptDate: parseResult?.receiptDate ?? todayDateString(),
        currency: parseResult?.currency ?? 'UAH',
        items: items.map(({ _key: _k, ...rest }) => rest),
      });
      setStep('success');
    } catch {
      setSubmitError('Не вдалось зберегти чек. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = () => {
    setStep('upload');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setParseResult(null);
    setStageIdx(0);
    setStageErrorIdx(null);
    setErrorCode(null);
    setStoreId(null);
    setPaymentMethodId(null);
    setTransactionCategoryId(null);
    setShowFieldErrors(false);
    setItems([]);
    setSubmitError(null);
  };

  // ── Items handlers ───────────────────────────────────────────────────────

  const handleSaveItem = (saved: EditableItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i._key === saved._key);
      if (idx === -1) return [...prev, saved];
      const next = [...prev]; next[idx] = saved; return next;
    });
    setSubModalItem(null);
  };
  const itemForSubModal: EditableItem | null = subModalItem === 'new' ? null : (subModalItem as EditableItem | null);

  const selectedStore = stores.find((s) => s.id === storeId);
  const selectedMethod = methods.find((m) => m.id === paymentMethodId);
  const selectedCategory = txCategories.find((c) => c.id === transactionCategoryId);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="flex-1 bg-[#F7F7F7]">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 32 }}>
          {step !== 'success' && (
            <div className="mb-4">
              <h1 className="text-[18px] font-medium text-[#1a1a1a]">Сканувати QR-код</h1>
              <p className="mt-0.5 text-[12px] text-[#9ca3af]">
                {step === 'upload' && 'Крок 1 — завантажте фото QR-коду'}
                {step === 'confirm' && 'Перевірте фото — QR-код має бути чітким і повністю в кадрі'}
                {step === 'processing' && 'Отримуємо дані чеку...'}
                {step === 'preview' && 'Дані отримано з реєстру ДПС'}
              </p>
            </div>
          )}

          {/* ── Step: Upload ─────────────────────────────────────────────── */}
          {step === 'upload' && !errorCode && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
              <div
                className="flex flex-col items-center rounded-xl px-6 py-12 text-center"
                style={{ border: '2px dashed #e5e7eb' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              >
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: '#E6F1FB', color: '#185FA5' }}
                >
                  <QrCode size={28} />
                </div>
                <p className="mb-1 text-[14px] font-medium text-[#1a1a1a]">
                  Сфотографуйте QR-код з фіскального чеку
                </p>
                <p className="mb-2 max-w-sm text-[13px] text-[#6b7280]">
                  Знайдіть квадратний штрих-код внизу чеку і сфотографуйте його
                </p>
                <p className="mb-5 text-[11px] text-[#9ca3af]">
                  Підтримувані формати: JPG, PNG, WEBP · до 10 MB
                </p>
                {fileError && (
                  <p className="mb-4 w-full rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
                    {fileError}
                  </p>
                )}
                <div className="grid w-full max-w-sm grid-cols-2 gap-2">
                  <Button
                    fullWidth
                    icon={<Camera size={14} />}
                    className="py-2 text-[13px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Сфотографувати
                  </Button>
                  <Button
                    fullWidth
                    variant="secondary"
                    icon={<ImageIcon size={14} />}
                    className="py-2 text-[13px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    З галереї
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Step: Confirm photo ─────────────────────────────────────── */}
          {step === 'confirm' && previewUrl && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
              <div
                className="mb-4 flex items-center justify-center overflow-hidden rounded-lg"
                style={{ height: 240, backgroundColor: '#1a1a1a' }}
              >
                <img
                  src={previewUrl}
                  alt="QR фото"
                  style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  icon={<RefreshCw size={14} />}
                  className="py-2 text-[13px]"
                  onClick={reset}
                >
                  Перефотографувати
                </Button>
                <Button
                  fullWidth
                  icon={<ArrowRight size={14} />}
                  className="py-2 text-[13px]"
                  onClick={() => void startProcessing()}
                >
                  Використати
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Processing ────────────────────────────────────────── */}
          {step === 'processing' && !errorCode && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
              <ProcessingStages activeIdx={stageIdx} errorIdx={stageErrorIdx} />
              <p className="mt-4 text-center text-[12px] text-[#9ca3af]">
                Зазвичай займає 5–10 секунд
              </p>
            </div>
          )}

          {/* ── Error state ─────────────────────────────────────────────── */}
          {errorCode && step !== 'success' && (
            <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-[#e5e7eb] bg-white p-8 text-center">
              <div
                className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full"
                style={{ backgroundColor: '#FCEBEB', color: '#A32D2D' }}
              >
                {ERROR_TEXT[errorCode].icon === 'qr' ? <ScanEye size={24} /> : <ServerOff size={24} />}
              </div>
              <p className="mb-2 text-[15px] font-medium text-[#1a1a1a]">{ERROR_TEXT[errorCode].title}</p>
              <p className="mb-6 text-[13px] leading-[1.5] text-[#6b7280]">{ERROR_TEXT[errorCode].sub}</p>
              <Button
                fullWidth
                icon={<RefreshCw size={14} />}
                className="mb-2 py-2 text-[13px]"
                onClick={reset}
              >
                Спробувати ще раз
              </Button>
              <div className="grid w-full grid-cols-2 gap-2">
                <Link href="/receipts/upload">
                  <Button variant="secondary" fullWidth icon={<Camera size={14} />} className="py-2 text-[13px]">
                    Фото чеку
                  </Button>
                </Link>
                <Link href="/receipts/upload/manual">
                  <Button variant="secondary" fullWidth icon={<Pencil size={14} />} className="py-2 text-[13px]">
                    Вручну
                  </Button>
                </Link>
              </div>
              <button
                type="button"
                onClick={() => router.push('/receipts')}
                className="mt-4 text-[12px] text-[#9ca3af] hover:underline"
              >
                Скасувати
              </button>
            </div>
          )}

          {/* ── Step: Preview ───────────────────────────────────────────── */}
          {step === 'preview' && parseResult && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
              <div
                className="mb-4 flex items-start gap-2 rounded-md px-3 py-[10px] text-[13px]"
                style={{ backgroundColor: '#E6F1FB', color: '#0C447C' }}
              >
                Перевірте дані та заповніть відсутні поля — вони позначені червоним
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] text-gray-500">
                    Магазин <DpsBadge />
                  </label>
                  <SearchableStoreSelect
                    value={storeId}
                    onChange={setStoreId}
                    stores={stores}
                    onCreate={async (name) => {
                      const { store } = await createStore(name);
                      return store ?? null;
                    }}
                    placeholder={parseResult.storeName ?? 'Оберіть магазин'}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] text-gray-500">
                    Дата покупки <DpsBadge />
                  </label>
                  <div className="flex h-[38px] items-center rounded-lg border border-[#e5e7eb] bg-[#F7F7F7] px-3 text-[13px] text-[#6b7280]">
                    {parseResult.receiptDate
                      ? new Date(parseResult.receiptDate).toLocaleString('uk-UA')
                      : '—'}
                  </div>
                </div>
                <div>
                  <label
                    className="mb-1 block text-[12px]"
                    style={{ color: showFieldErrors && !paymentMethodId ? '#A32D2D' : '#6b7280' }}
                  >
                    Метод оплати *
                  </label>
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
                  <label
                    className="mb-1 block text-[12px]"
                    style={{ color: showFieldErrors && !transactionCategoryId ? '#A32D2D' : '#6b7280' }}
                  >
                    Категорія транзакції *
                  </label>
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

              <p className="mb-2 text-[12px] uppercase tracking-wide text-[#9ca3af]">
                Товари (з ДПС)
              </p>

              <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
                <div
                  className="grid text-[11px] uppercase tracking-wide text-[#9ca3af]"
                  style={{ gridTemplateColumns: '3fr 1fr 1fr 56px', padding: '8px 12px', backgroundColor: '#F7F7F7' }}
                >
                  <span>Назва</span>
                  <span>К-сть</span>
                  <span className="text-right">Сума</span>
                  <span />
                </div>
                {items.map((item) => (
                  <div
                    key={item._key}
                    className="grid items-center border-t border-[#e5e7eb]"
                    style={{ gridTemplateColumns: '3fr 1fr 1fr 56px', padding: '8px 12px' }}
                  >
                    <span className="text-[13px] text-[#1a1a1a]">{item.name}</span>
                    <span className="text-[13px] text-[#6b7280]">
                      {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                    </span>
                    <span className="text-right text-[13px] font-medium">
                      {(() => {
                        const d = item.discountAmount ?? 0;
                        const final = Math.max(0, Math.round((item.originalAmount - d) * 100) / 100);
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
                      <button type="button" onClick={() => setSubModalItem(item)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"><Pencil size={13} /></button>
                      <button type="button" onClick={() => setItems((prev) => prev.filter((i) => i._key !== item._key))} className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#FCEBEB] hover:text-[#A32D2D]"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSubModalItem('new')}
                  className="flex w-full items-center gap-2 border-t border-[#e5e7eb] px-3 py-2 text-left text-[13px] text-[#6b7280] hover:bg-[#F7F7F7]"
                >
                  <Plus size={14} />
                  Додати товар
                </button>
              </div>

              <div className="mt-3 flex items-center justify-end gap-3">
                <span className="text-[13px] text-[#6b7280]">
                  Загальна сума <DpsBadge />
                </span>
                <span className="text-[16px] font-medium">
                  {Math.round((parseResult.totalAmount ?? 0) * 100) / 100} {parseResult.currency}
                </span>
              </div>

              {(() => {
                const computedTotal = items.reduce(
                  (s, it) => s + Math.max(0, it.originalAmount - (it.discountAmount ?? 0)),
                  0,
                );
                const mismatch =
                  parseResult.totalAmount != null &&
                  Math.abs(computedTotal - parseResult.totalAmount) > 0.01;
                if (!mismatch) return null;
                return (
                  <div
                    className="mt-3 flex items-start gap-2 rounded-md px-3 py-[10px] text-[13px]"
                    style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}
                  >
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    Сума товарів відрізняється від загальної суми чеку. Перевірте дані.
                  </div>
                );
              })()}

              {submitError && (
                <p className="mt-3 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">{submitError}</p>
              )}

              <div className="mt-6 flex justify-between">
                <Button variant="secondary" fullWidth={false} className="py-2 px-6 text-[13px]" onClick={() => router.push('/receipts')}>
                  Скасувати
                </Button>
                <Button
                  fullWidth={false}
                  isLoading={isSubmitting}
                  disabled={items.length === 0}
                  icon={<Check size={14} />}
                  className="py-2 px-6 text-[13px]"
                  onClick={handleConfirm}
                >
                  Підтвердити
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Success ───────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#EAF3DE' }}>
                <Check size={32} color="#3B6D11" />
              </div>
              <h2 className="mb-2 text-[20px] font-medium">Чек збережено</h2>
              <p className="mb-8 text-[14px] text-[#6b7280]">Товари додано до вашої статистики витрат</p>
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                {selectedStore && <span className="rounded-full bg-white px-3 py-1 text-[13px] shadow-sm border border-[#e5e7eb]">{selectedStore.name}</span>}
                {selectedMethod && <span className="rounded-full bg-white px-3 py-1 text-[13px] shadow-sm border border-[#e5e7eb]">{selectedMethod.name}</span>}
                {selectedCategory && <span className="rounded-full bg-white px-3 py-1 text-[13px] shadow-sm border border-[#e5e7eb]">{selectedCategory.name}</span>}
                <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[13px] font-medium text-[#3B6D11]">
                  {Math.round((parseResult?.totalAmount ?? 0) * 100) / 100} {parseResult?.currency ?? 'UAH'}
                </span>
              </div>
              <div className="flex gap-3">
                <Button fullWidth={false} onClick={reset} className="py-2 px-6 text-[13px]">Додати ще чек</Button>
                <Button variant="secondary" fullWidth={false} className="py-2 px-6 text-[13px]" onClick={() => router.push('/receipts')}>До списку чеків</Button>
              </div>
            </div>
          )}
        </div>
      </main>

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

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractErrorCode(err: unknown): ErrorCode {
  if (err instanceof ApiError) {
    const data = err.data as { code?: string } | undefined;
    const code = data?.code;
    if (
      code === 'QR_NOT_FOUND' ||
      code === 'QR_INVALID_PARAMS' ||
      code === 'QR_NOT_FISCAL' ||
      code === 'DPS_UNAVAILABLE' ||
      code === 'DPS_NOT_FOUND' ||
      code === 'DPS_PARSE_FAILED'
    ) {
      return code;
    }
  }
  return 'GENERIC';
}
