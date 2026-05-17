'use client';

import { useState } from 'react';
import { Plus, Pencil, Check, X, LogOut } from 'lucide-react';
import { TopNav } from '@/src/components/features/home/TopNav';
import { Button } from '@/src/components/ui/Button';
import { Banner } from '@/src/components/ui/Banner';
import { usePaymentMethods } from '@/src/hooks/usePaymentMethods';
import { useLogout } from '@/src/hooks/useAuth';
import {
  PaymentMethodType,
  PAYMENT_METHOD_TYPE_LABELS,
} from '@/src/types/payment-method.types';
import type { PaymentMethod } from '@/src/types/payment-method.types';

const TYPE_OPTIONS = Object.values(PaymentMethodType);

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
          <Button
            variant="danger"
            fullWidth={false}
            icon={<LogOut size={16} />}
            onClick={onConfirm}
          >
            Вийти
          </Button>
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: PaymentMethodType }) {
  return (
    <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[11px] text-gray-500">
      {PAYMENT_METHOD_TYPE_LABELS[type]}
    </span>
  );
}

interface TypeSelectProps {
  value: PaymentMethodType;
  onChange: (v: PaymentMethodType) => void;
}

function TypeSelect({ value, onChange }: TypeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PaymentMethodType)}
      className="h-[34px] rounded-lg border border-[#e5e7eb] px-2 text-[13px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
    >
      {TYPE_OPTIONS.map((t) => (
        <option key={t} value={t}>
          {PAYMENT_METHOD_TYPE_LABELS[t]}
        </option>
      ))}
    </select>
  );
}

export default function PaymentMethodsPage() {
  const { methods, isLoading, error, createMethod, updateMethod } =
    usePaymentMethods();
  const { logout } = useLogout();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // add form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<PaymentMethodType>(PaymentMethodType.CARD);
  const [addError, setAddError] = useState('');
  const [isAddLoading, setIsAddLoading] = useState(false);

  // inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<PaymentMethodType>(PaymentMethodType.CARD);
  const [editError, setEditError] = useState('');
  const [isEditLoading, setIsEditLoading] = useState(false);

  function startEdit(method: PaymentMethod) {
    setEditingId(method.id);
    setEditName(method.name);
    setEditType(method.type);
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError('');
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) { setAddError('Введіть назву'); return; }
    setIsAddLoading(true);
    const { error: err } = await createMethod(name, newType);
    setIsAddLoading(false);
    if (err) { setAddError(err); return; }
    setNewName('');
    setNewType(PaymentMethodType.CARD);
    setIsAdding(false);
    setAddError('');
  }

  async function handleEdit() {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) { setEditError('Введіть назву'); return; }
    const original = methods.find((m) => m.id === editingId);
    if (!original) return;

    const nameChanged = name !== original.name;
    const typeChanged = editType !== original.type;
    if (!nameChanged && !typeChanged) { cancelEdit(); return; }

    const dto: { name?: string; type?: PaymentMethodType } = {};
    if (nameChanged) dto.name = name;
    if (typeChanged) dto.type = editType;

    setIsEditLoading(true);
    const { error: err } = await updateMethod(editingId, dto);
    setIsEditLoading(false);
    if (err) { setEditError(err); return; }
    cancelEdit();
  }

  const showList = methods.length > 0 || isAdding;

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="mx-auto w-full max-w-[1024px] flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[22px] font-medium">Методи оплати</h1>
          <Button
            fullWidth={false}
            icon={<Plus size={16} />}
            onClick={() => { setIsAdding(true); setAddError(''); }}
            disabled={isAdding}
          >
            Додати метод
          </Button>
        </div>

        {error && (
          <div className="mb-4">
            <Banner variant="error">{error}</Banner>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-[14px] text-gray-400">
            Завантаження...
          </div>
        ) : !showList ? (
          <div className="flex flex-col items-center rounded-xl border border-[#e5e7eb] py-12">
            <p className="text-[14px] text-gray-400">
              Ви ще не додали жодного методу оплати
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#e5e7eb]">
            {methods.map((method, i) => {
              const isLast = i === methods.length - 1 && !isAdding;
              const isEditing = editingId === method.id;
              return (
                <div
                  key={method.id}
                  className={['px-4 py-3', !isLast ? 'border-b border-[#e5e7eb]' : ''].join(' ')}
                >
                  {isEditing ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="h-[34px] flex-1 rounded-lg border border-[#1a1a1a] px-3 text-[14px] outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                        />
                        <TypeSelect value={editType} onChange={setEditType} />
                        <button
                          type="button"
                          onClick={handleEdit}
                          disabled={isEditLoading}
                          className="text-[#3B6D11] transition-opacity hover:opacity-70 disabled:opacity-40"
                          aria-label="Зберегти"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-gray-400 transition-opacity hover:opacity-70"
                          aria-label="Скасувати"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {editError && (
                        <p className="mt-1 text-[12px] text-[#A32D2D]">{editError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-[14px] text-gray-700">
                        {method.name}
                      </span>
                      <TypeBadge type={method.type} />
                      <button
                        type="button"
                        onClick={() => startEdit(method)}
                        className="ml-1 text-gray-400 transition-colors hover:text-gray-700"
                        aria-label="Редагувати"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isAdding && (
              <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd();
                      if (e.key === 'Escape') {
                        setIsAdding(false);
                        setNewName('');
                        setAddError('');
                      }
                    }}
                    placeholder="Назва методу"
                    className="h-[34px] flex-1 rounded-lg border border-[#1a1a1a] px-3 text-[14px] outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                  <TypeSelect value={newType} onChange={setNewType} />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isAddLoading}
                    className="text-[#3B6D11] transition-opacity hover:opacity-70 disabled:opacity-40"
                    aria-label="Додати"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setNewName(''); setAddError(''); }}
                    className="text-gray-400 transition-opacity hover:opacity-70"
                    aria-label="Скасувати"
                  >
                    <X size={16} />
                  </button>
                </div>
                {addError && (
                  <p className="mt-1 text-[12px] text-[#A32D2D]">{addError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}
