'use client';

import { useState } from 'react';
import {
  Plus,
  CreditCard,
  Pencil,
  Trash2,
  X,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { usePaymentMethods } from '@/src/hooks/usePaymentMethods';
import type { PaymentMethod } from '@/src/types/payment-method.types';

// ─── Modals ───────────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreate: (name: string) => Promise<{ error?: string }>;
}

function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
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
    if (!validateName()) return;

    setIsLoading(true);
    const result = await onCreate(name.trim());
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
        className="w-[420px] max-w-[calc(100%-32px)] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Новий метод оплати</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Name field */}
        <div className="mb-5">
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
    dto: { name?: string },
  ) => Promise<{ error?: string }>;
}

function EditModal({ method, onClose, onUpdate }: EditModalProps) {
  const [name, setName] = useState(method.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasChanged = name.trim() !== method.name;

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

    const dto: { name?: string } = {};
    if (name.trim() !== method.name) dto.name = name.trim();

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
        className="w-[420px] max-w-[calc(100%-32px)] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Редагувати метод оплати</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Name field */}
        <div className="mb-5">
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

// ─── Delete modal ──────────────────────────────────────────────────────────────

interface DeleteModalProps {
  method: PaymentMethod;
  onClose: () => void;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

function DeleteModal({ method, onClose, onDelete }: DeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setDeleteError(null);
    const result = await onDelete(method.id);
    setIsLoading(false);
    if (result.error) {
      setDeleteError(result.error);
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
        className="w-[400px] max-w-[calc(100%-32px)] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Видалити метод оплати?</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <p className="mb-5 text-[13px] leading-[1.5] text-gray-500">
          Метод{' '}
          <span className="font-medium text-[#1a1a1a]">«{method.name}»</span>{' '}
          буде видалено. Цю дію не можна скасувати.
        </p>

        {/* Delete error */}
        {deleteError && (
          <p className="mb-4 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
            Не вдалось видалити. Спробуйте ще раз.
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onClose}>
            Скасувати
          </Button>
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

// ─── Payment method row ────────────────────────────────────────────────────────

interface PaymentMethodRowProps {
  method: PaymentMethod;
  onEdit: () => void;
  onDelete: () => void;
}

function PaymentMethodRow({ method, onEdit, onDelete }: PaymentMethodRowProps) {
  return (
    <div className="group flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-3 last:border-b-0">
      {/* Icon */}
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: '#F7F7F7', color: '#6b7280' }}
      >
        <CreditCard size={20} />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[14px] text-[#1a1a1a]">{method.name}</span>
      </div>

      {/* Action buttons — hover reveal */}
      <div className="flex gap-1 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#FCEBEB] hover:text-[#A32D2D]"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function PaymentMethodsPage() {
  const { methods, isLoading, error, createMethod, updateMethod, removeMethod } = usePaymentMethods();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null);

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
        <div className="mt-5 flex items-center justify-center py-12 text-[13px] text-gray-500">
          Завантаження...
        </div>
      ) : methods.length === 0 && !error ? (
        /* Empty state */
        <div className="mt-5 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
          <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
            <div
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--brand-soft)' }}
            >
              <CreditCard size={24} style={{ color: 'var(--brand)' }} />
            </div>
            <p className="text-[15px] font-medium text-[#1a1a1a]">Поки порожньо</p>
            <p className="max-w-[280px] text-[13px] leading-[1.5] text-gray-500">
              Додайте перший запис — це займе секунди
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
              onDelete={() => setDeletingMethod(method)}
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

      {deletingMethod && (
        <DeleteModal
          method={deletingMethod}
          onClose={() => setDeletingMethod(null)}
          onDelete={removeMethod}
        />
      )}
    </div>
  );
}
