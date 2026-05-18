'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Store,
  Lock,
  Pencil,
  Trash2,
  X,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useStores } from '@/src/hooks/useStores';
import type { Store as StoreType } from '@/src/types/store.types';

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
      setNameError('Введіть назву магазину');
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
        className="w-[400px] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Новий магазин</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-[12px] text-gray-500">Назва магазину</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={validateName}
            maxLength={100}
            placeholder=""
            error={nameError ?? undefined}
            isFilled={name.trim().length > 0 && !nameError}
          />
          <p className="mt-1 text-right text-[12px] text-[#9ca3af]">{name.length} / 100</p>
        </div>

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
  store: StoreType;
  onClose: () => void;
  onUpdate: (id: string, name: string) => Promise<{ error?: string }>;
}

function EditModal({ store, onClose, onUpdate }: EditModalProps) {
  const [name, setName] = useState(store.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasChanged = name.trim() !== store.name;

  const validateName = (): boolean => {
    if (!name.trim()) {
      setNameError('Введіть назву магазину');
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
    setIsLoading(true);
    const result = await onUpdate(store.id, name.trim());
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
        className="w-[400px] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Редагувати магазин</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-[12px] text-gray-500">Назва магазину</label>
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

interface DeleteModalProps {
  store: StoreType;
  receiptsCount: number;
  onClose: () => void;
  onConfirm: (id: string) => Promise<{ error?: string }>;
}

function DeleteModal({ store, receiptsCount, onClose, onConfirm }: DeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isVariantB = receiptsCount > 0;

  const handleConfirm = async () => {
    setIsLoading(true);
    setDeleteError(null);
    const result = await onConfirm(store.id);
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
        className="w-[400px] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Видалити магазин?</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        {isVariantB && (
          <div className="mb-4 flex items-start gap-2 rounded-md px-3 py-[10px]" style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}>
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span className="text-[13px]">
              Цей магазин використовується у{' '}
              <span className="font-medium">{receiptsCount}</span> чеках. Після видалення чеки
              збережуться, але магазин у них буде позначений як видалений.
            </span>
          </div>
        )}

        <p className="mb-5 text-[13px] leading-[1.5] text-gray-500">
          {isVariantB ? (
            'Хочете продовжити?'
          ) : (
            <>
              Магазин{' '}
              <span className="font-medium text-[#1a1a1a]">«{store.name}»</span>{' '}
              буде видалено. Цю дію не можна скасувати.
            </>
          )}
        </p>

        {deleteError && (
          <p className="mb-4 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
            Не вдалось видалити. Спробуйте ще раз.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onClose}>
            Скасувати
          </Button>
          <Button
            variant="danger"
            fullWidth={false}
            isLoading={isLoading}
            icon={<Trash2 size={14} />}
            onClick={handleConfirm}
            className="py-2 px-[14px] text-[13px]"
          >
            {isVariantB ? 'Все одно видалити' : 'Видалити'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Store row ─────────────────────────────────────────────────────────────────

interface StoreRowProps {
  store: StoreType;
  isSystem: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function StoreRow({ store, isSystem, onEdit, onDelete }: StoreRowProps) {
  return (
    <div className="group flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-[11px] last:border-b-0">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={
          isSystem
            ? { backgroundColor: '#F7F7F7', color: '#6b7280' }
            : { backgroundColor: '#EAF3DE', color: '#3B6D11' }
        }
      >
        <Store size={15} />
      </div>

      <span className="flex-1 text-[14px] text-[#1a1a1a]">{store.name}</span>

      {isSystem ? (
        <span className="rounded-full bg-[#E6F1FB] px-2 py-0.5 text-[11px] text-[#0C447C]">
          Системний
        </span>
      ) : (
        <span className="text-[12px] text-[#9ca3af]">Додано вами</span>
      )}

      <div className="flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {isSystem ? (
          <button
            type="button"
            disabled
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] opacity-40"
          >
            <Lock size={14} />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#FCEBEB] hover:text-[#A32D2D]"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Section block ─────────────────────────────────────────────────────────────

interface SectionBlockProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

function SectionBlock({ title, count, children }: SectionBlockProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
      <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-4 py-3">
        <span className="text-[12px] uppercase tracking-[0.06em] text-[#9ca3af]">{title}</span>
        <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[11px] text-[#6b7280]">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function StoresPage() {
  const { stores, isLoading, error, createStore, updateStore, checkStore, removeConfirmedStore } = useStores();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [deletingStore, setDeletingStore] = useState<StoreType | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<{ receiptsCount: number } | null>(null);

  const systemStores = useMemo(
    () =>
      stores
        .filter((s) => s.userId === null)
        .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [stores, searchQuery],
  );

  const userStores = useMemo(
    () =>
      stores
        .filter((s) => s.userId !== null)
        .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [stores, searchQuery],
  );

  const handleDeleteClick = async (store: StoreType) => {
    const result = await checkStore(store.id);
    if (result.error) return;
    setDeletingStore(store);
    setDeleteCheck({ receiptsCount: result.receiptsCount ?? 0 });
  };

  const handleDeleteClose = () => {
    setDeletingStore(null);
    setDeleteCheck(null);
  };

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-medium text-[#1a1a1a]">Магазини</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Системні та власні магазини</p>
        </div>
        <Button
          fullWidth={false}
          icon={<Plus size={15} />}
          className="py-2 px-3 text-[13px]"
          onClick={() => setShowCreateModal(true)}
        >
          Додати магазин
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-[#FCEBEB] px-3 py-[10px] text-[#A32D2D]">
          <WifiOff size={16} className="flex-shrink-0" />
          <span className="text-[13px]">
            Не вдалось завантажити список магазинів. Перевірте підключення.{' '}
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

      <div className="mt-4" style={{ width: '260px' }}>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук магазину..."
            className="h-[38px] w-full rounded-lg border border-[#e5e7eb] bg-white pl-[34px] pr-3 text-[13px] outline-none transition-colors focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 flex items-center justify-center py-12 text-[13px] text-gray-400">
          Завантаження...
        </div>
      ) : (
        <>
          <div className="mt-5">
            <SectionBlock title="Системні" count={systemStores.length}>
              {systemStores.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-gray-400">
                  Немає системних магазинів
                </div>
              ) : (
                systemStores.map((store) => (
                  <StoreRow
                    key={store.id}
                    store={store}
                    isSystem
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))
              )}
            </SectionBlock>
          </div>

          <div className="mt-4">
            <SectionBlock title="Мої магазини" count={userStores.length}>
              {userStores.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-[14px] text-[13px] text-[#9ca3af]">
                  <Plus size={16} />
                  Додайте свій магазин — натисніть «Додати магазин» вгорі
                </div>
              ) : (
                userStores.map((store) => (
                  <StoreRow
                    key={store.id}
                    store={store}
                    isSystem={false}
                    onEdit={() => setEditingStore(store)}
                    onDelete={() => handleDeleteClick(store)}
                  />
                ))
              )}
            </SectionBlock>
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createStore}
        />
      )}

      {editingStore && (
        <EditModal
          store={editingStore}
          onClose={() => setEditingStore(null)}
          onUpdate={updateStore}
        />
      )}

      {deletingStore && deleteCheck !== null && (
        <DeleteModal
          store={deletingStore}
          receiptsCount={deleteCheck.receiptsCount}
          onClose={handleDeleteClose}
          onConfirm={removeConfirmedStore}
        />
      )}
    </div>
  );
}
