'use client';

import { useState } from 'react';
import {
  Plus,
  CreditCard,
  Banknote,
  Smartphone,
  MoreHorizontal,
  Pencil,
  X,
  WifiOff,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { usePaymentMethods } from '@/src/hooks/usePaymentMethods';
import { PaymentMethodType } from '@/src/types/payment-method.types';
import type { PaymentMethod } from '@/src/types/payment-method.types';

// ─── Type config ───────────────────────────────────────────────────────────────

interface TypeConfig {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
}

const TYPE_CONFIG: Record<PaymentMethodType, TypeConfig> = {
  [PaymentMethodType.CARD]: {
    label: 'Банківська картка',
    icon: <CreditCard size={16} />,
    iconBg: '#E6F1FB',
    iconColor: '#185FA5',
    badgeBg: '#E6F1FB',
    badgeText: '#0C447C',
  },
  [PaymentMethodType.CASH]: {
    label: 'Готівка',
    icon: <Banknote size={16} />,
    iconBg: '#EAF3DE',
    iconColor: '#3B6D11',
    badgeBg: '#EAF3DE',
    badgeText: '#27500A',
  },
  [PaymentMethodType.DIGITAL]: {
    label: 'Цифровий гаманець',
    icon: <Smartphone size={16} />,
    iconBg: '#FAEEDA',
    iconColor: '#854F0B',
    badgeBg: '#FAEEDA',
    badgeText: '#633806',
  },
  [PaymentMethodType.OTHER]: {
    label: 'Інше',
    icon: <MoreHorizontal size={16} />,
    iconBg: '#EEEDFE',
    iconColor: '#534AB7',
    badgeBg: '#EEEDFE',
    badgeText: '#3C3489',
  },
};

const TYPE_ORDER: PaymentMethodType[] = [
  PaymentMethodType.CARD,
  PaymentMethodType.CASH,
  PaymentMethodType.DIGITAL,
  PaymentMethodType.OTHER,
];

// ─── Type tile grid ────────────────────────────────────────────────────────────

interface TypeTileGridProps {
  selected: PaymentMethodType | null;
  onSelect: (type: PaymentMethodType) => void;
  hasError: boolean;
}

function TypeTileGrid({ selected, onSelect, hasError }: TypeTileGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TYPE_ORDER.map((type) => {
        const cfg = TYPE_CONFIG[type];
        const isSelected = selected === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={[
              'flex cursor-pointer items-center gap-[10px] rounded-md border px-3 py-[10px] text-left text-[13px] transition-colors',
              isSelected
                ? 'border-[#1a1a1a] bg-[#F7F7F7]'
                : hasError
                  ? 'border-[#A32D2D]'
                  : 'border-[#e5e7eb]',
            ].join(' ')}
          >
            {/* Type icon */}
            <span
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[6px]"
              style={{ backgroundColor: cfg.iconBg, color: cfg.iconColor }}
            >
              <span style={{ display: 'flex' }}>
                {type === PaymentMethodType.CARD && <CreditCard size={14} />}
                {type === PaymentMethodType.CASH && <Banknote size={14} />}
                {type === PaymentMethodType.DIGITAL && <Smartphone size={14} />}
                {type === PaymentMethodType.OTHER && <MoreHorizontal size={14} />}
              </span>
            </span>

            {/* Label */}
            <span className="flex-1 text-[#1a1a1a]">{cfg.label}</span>

            {/* Check circle */}
            <CheckCircle2
              size={16}
              className={[
                'flex-shrink-0 transition-opacity',
                isSelected ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
              style={{ color: '#1a1a1a' }}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreate: (name: string, type: PaymentMethodType) => Promise<{ error?: string }>;
}

function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PaymentMethodType | null>(null);
  const [typeError, setTypeError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateName = (): boolean => {
    if (!name.trim()) {
      setNameError('Введіть назву');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleSubmit = async () => {
    const nameValid = validateName();
    const typeValid = selectedType !== null;

    if (!typeValid) setTypeError(true);
    if (!nameValid || !typeValid) return;

    setIsLoading(true);
    const result = await onCreate(name.trim(), selectedType!);
    setIsLoading(false);

    if (result.error) {
      setNameError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Новий метод оплати</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Name field */}
        <div className="mb-4">
          <label className="mb-1 block text-[12px] text-gray-500">Назва</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={validateName}
            maxLength={100}
            error={nameError ?? undefined}
            isFilled={name.trim().length > 0 && !nameError}
          />
          <p className="mt-1 text-right text-[12px] text-[#9ca3af]">{name.length} / 100</p>
        </div>

        {/* Type field */}
        <div className="mb-5">
          <label className="mb-2 block text-[12px] text-gray-500">Тип</label>
          <TypeTileGrid
            selected={selectedType}
            onSelect={(type) => {
              setSelectedType(type);
              setTypeError(false);
            }}
            hasError={typeError}
          />
          {typeError && (
            <p className="mt-1 text-[12px] text-[#A32D2D]">Виберіть тип</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onClose}>
            Скасувати
          </Button>
          <Button fullWidth={false} isLoading={isLoading} onClick={handleSubmit}>
            Зберегти
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EditModalProps {
  method: PaymentMethod;
  onClose: () => void;
  onUpdate: (
    id: string,
    dto: { name?: string; type?: PaymentMethodType },
  ) => Promise<{ error?: string }>;
}

function EditModal({ method, onClose, onUpdate }: EditModalProps) {
  const [name, setName] = useState(method.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PaymentMethodType>(method.type);
  const [isLoading, setIsLoading] = useState(false);

  const hasChanged = name.trim() !== method.name || selectedType !== method.type;

  const validateName = (): boolean => {
    if (!name.trim()) {
      setNameError('Введіть назву');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!hasChanged) {
      onClose();
      return;
    }
    if (!validateName()) return;

    const dto: { name?: string; type?: PaymentMethodType } = {};
    if (name.trim() !== method.name) dto.name = name.trim();
    if (selectedType !== method.type) dto.type = selectedType;

    setIsLoading(true);
    const result = await onUpdate(method.id, dto);
    setIsLoading(false);

    if (result.error) {
      setNameError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Редагувати метод оплати</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Name field */}
        <div className="mb-4">
          <label className="mb-1 block text-[12px] text-gray-500">Назва</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={validateName}
            maxLength={100}
            error={nameError ?? undefined}
            isFilled={name.trim().length > 0 && !nameError}
          />
          <p className="mt-1 text-right text-[12px] text-[#9ca3af]">{name.length} / 100</p>
        </div>

        {/* Type field */}
        <div className="mb-5">
          <label className="mb-2 block text-[12px] text-gray-500">Тип</label>
          <TypeTileGrid
            selected={selectedType}
            onSelect={setSelectedType}
            hasError={false}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onClose}>
            Скасувати
          </Button>
          <Button
            fullWidth={false}
            isLoading={isLoading}
            disabled={!hasChanged}
            onClick={handleSubmit}
          >
            Зберегти зміни
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment method row ────────────────────────────────────────────────────────

interface PaymentMethodRowProps {
  method: PaymentMethod;
  onEdit: () => void;
}

function PaymentMethodRow({ method, onEdit }: PaymentMethodRowProps) {
  const cfg = TYPE_CONFIG[method.type];

  return (
    <div className="group flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-3 last:border-b-0">
      {/* Icon */}
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: cfg.iconBg, color: cfg.iconColor }}
      >
        {method.type === PaymentMethodType.CARD && <CreditCard size={16} />}
        {method.type === PaymentMethodType.CASH && <Banknote size={16} />}
        {method.type === PaymentMethodType.DIGITAL && <Smartphone size={16} />}
        {method.type === PaymentMethodType.OTHER && <MoreHorizontal size={16} />}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[14px] text-[#1a1a1a]">{method.name}</span>
        <span
          className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px]"
          style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeText }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Edit button — hover reveal */}
      <div className="flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
        >
          <Pencil size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function PaymentMethodsPage() {
  const { methods, isLoading, error, createMethod, updateMethod } = usePaymentMethods();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  return (
    <div>
      {/* Content header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-medium text-[#1a1a1a]">Методи оплати</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Лише власні — без системних</p>
        </div>
        <Button
          fullWidth={false}
          icon={<Plus size={15} />}
          className="py-2 px-3 text-[13px]"
          onClick={() => setShowCreateModal(true)}
        >
          Додати метод оплати
        </Button>
      </div>

      {/* Network error banner */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-[#FCEBEB] px-3 py-[10px] text-[#A32D2D]">
          <WifiOff size={16} className="flex-shrink-0" />
          <span className="text-[13px]">
            Не вдалось завантажити список методів оплати. Перевірте підключення.{' '}
            <button
              type="button"
              className="font-medium underline"
              onClick={() => window.location.reload()}
            >
              Оновити
            </button>
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="mt-5 flex items-center justify-center py-12 text-[13px] text-gray-400">
          Завантаження...
        </div>
      ) : methods.length === 0 && !error ? (
        /* Empty state */
        <div className="mt-5 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
          <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F7]">
              <CreditCard size={24} className="text-[#9ca3af]" />
            </div>
            <p className="text-[15px] font-medium text-[#1a1a1a]">Немає методів оплати</p>
            <p className="max-w-[280px] text-[13px] leading-[1.5] text-gray-500">
              Додайте перший метод оплати — картку, готівку або цифровий гаманець
            </p>
            <Button
              fullWidth={false}
              icon={<Plus size={15} />}
              className="mt-2 py-2 px-3 text-[13px]"
              onClick={() => setShowCreateModal(true)}
            >
              Додати метод оплати
            </Button>
          </div>
        </div>
      ) : (
        /* Methods list */
        <div className="mt-5 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
          {methods.map((method) => (
            <PaymentMethodRow
              key={method.id}
              method={method}
              onEdit={() => setEditingMethod(method)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createMethod}
        />
      )}

      {editingMethod && (
        <EditModal
          method={editingMethod}
          onClose={() => setEditingMethod(null)}
          onUpdate={updateMethod}
        />
      )}
    </div>
  );
}
