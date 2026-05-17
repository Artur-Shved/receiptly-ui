'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ShoppingBasket,
  Lock,
  Pencil,
  Trash2,
  X,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useItemCategories } from '@/src/hooks/useItemCategories';
import type { ItemCategory } from '@/src/types/item-category.types';

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
      setNameError('Введіть назву категорії');
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
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Нова категорія товару</h2>
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
          <label className="mb-1 block text-[12px] text-gray-500">Назва категорії</label>
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
  category: ItemCategory;
  onClose: () => void;
  onUpdate: (id: string, name: string) => Promise<{ error?: string }>;
}

function EditModal({ category, onClose, onUpdate }: EditModalProps) {
  const [name, setName] = useState(category.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasChanged = name.trim() !== category.name;

  const validateName = (): boolean => {
    if (!name.trim()) {
      setNameError('Введіть назву категорії');
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
    const result = await onUpdate(category.id, name.trim());
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
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Редагувати категорію</h2>
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
          <label className="mb-1 block text-[12px] text-gray-500">Назва категорії</label>
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

interface DeleteModalProps {
  category: ItemCategory;
  itemsCount: number;
  onClose: () => void;
  onConfirm: (id: string) => Promise<{ error?: string }>;
}

function DeleteModal({ category, itemsCount, onClose, onConfirm }: DeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isVariantB = itemsCount > 0;

  const handleConfirm = async () => {
    setIsLoading(true);
    setDeleteError(null);
    const result = await onConfirm(category.id);
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
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Видалити категорію?</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Variant B: warning banner */}
        {isVariantB && (
          <div className="mb-4 flex items-start gap-2 rounded-md px-3 py-[10px]" style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}>
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span className="text-[13px]">
              Ця категорія використовується у{' '}
              <span className="font-medium">{itemsCount}</span> товарах. Після видалення товари
              збережуться, але категорія у них буде очищена.
            </span>
          </div>
        )}

        {/* Body text */}
        <p className="mb-5 text-[13px] leading-[1.5] text-gray-500">
          {isVariantB ? (
            'Хочете продовжити?'
          ) : (
            <>
              Категорія{' '}
              <span className="font-medium text-[#1a1a1a]">«{category.name}»</span>{' '}
              буде видалена. Цю дію не можна скасувати.
            </>
          )}
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

// ─── Category row ──────────────────────────────────────────────────────────────

interface CategoryRowProps {
  category: ItemCategory;
  isSystem: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function CategoryRow({ category, isSystem, onEdit, onDelete }: CategoryRowProps) {
  return (
    <div className="group flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-[11px] last:border-b-0">
      {/* Icon */}
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={
          isSystem
            ? { backgroundColor: '#F7F7F7', color: '#6b7280' }
            : { backgroundColor: '#EAF3DE', color: '#3B6D11' }
        }
      >
        <ShoppingBasket size={15} />
      </div>

      {/* Name */}
      <span className="flex-1 text-[14px] text-[#1a1a1a]">{category.name}</span>

      {/* Badge / meta */}
      {isSystem ? (
        <span className="rounded-full bg-[#E6F1FB] px-2 py-0.5 text-[11px] text-[#0C447C]">
          Системна
        </span>
      ) : (
        <span className="text-[12px] text-[#9ca3af]">Додано вами</span>
      )}

      {/* Action buttons — hover reveal */}
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

export default function ItemCategoriesPage() {
  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    removeCategory,
    removeConfirmedCategory,
  } = useItemCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ItemCategory | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<{ itemsCount: number } | null>(null);

  const systemCategories = useMemo(
    () =>
      categories
        .filter((c) => c.userId === null)
        .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [categories, searchQuery],
  );

  const userCategories = useMemo(
    () =>
      categories
        .filter((c) => c.userId !== null)
        .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [categories, searchQuery],
  );

  const handleDeleteClick = async (category: ItemCategory) => {
    const result = await removeCategory(category.id);
    if (result.error) {
      // network error — skip modal, surface nothing (user can retry)
      return;
    }
    setDeletingCategory(category);
    setDeleteInfo({ itemsCount: result.itemsCount ?? 0 });
  };

  const handleDeleteClose = () => {
    setDeletingCategory(null);
    setDeleteInfo(null);
  };

  return (
    <div>
      {/* Content header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-medium text-[#1a1a1a]">Категорії товарів</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Системні та власні категорії</p>
        </div>
        <Button
          fullWidth={false}
          icon={<Plus size={15} />}
          className="py-2 px-3 text-[13px]"
          onClick={() => setShowCreateModal(true)}
        >
          Додати категорію
        </Button>
      </div>

      {/* Network error banner */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-[#FCEBEB] px-3 py-[10px] text-[#A32D2D]">
          <WifiOff size={16} className="flex-shrink-0" />
          <span className="text-[13px]">
            Не вдалось завантажити список категорій. Перевірте підключення.{' '}
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

      {/* Search row */}
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
            placeholder="Пошук категорії..."
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
          {/* System categories section */}
          <div className="mt-5">
            <SectionBlock title="Системні" count={systemCategories.length}>
              {systemCategories.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-gray-400">
                  Немає системних категорій
                </div>
              ) : (
                systemCategories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    isSystem
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))
              )}
            </SectionBlock>
          </div>

          {/* User categories section */}
          <div className="mt-4">
            <SectionBlock title="Мої категорії" count={userCategories.length}>
              {userCategories.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-[14px] text-[13px] text-[#9ca3af]">
                  <Plus size={16} />
                  Додайте свою категорію — натисніть «Додати категорію» вгорі
                </div>
              ) : (
                userCategories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    isSystem={false}
                    onEdit={() => setEditingCategory(category)}
                    onDelete={() => handleDeleteClick(category)}
                  />
                ))
              )}
            </SectionBlock>
          </div>
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createCategory}
        />
      )}

      {editingCategory && (
        <EditModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onUpdate={updateCategory}
        />
      )}

      {deletingCategory && deleteInfo !== null && (
        <DeleteModal
          category={deletingCategory}
          itemsCount={deleteInfo.itemsCount}
          onClose={handleDeleteClose}
          onConfirm={removeConfirmedCategory}
        />
      )}
    </div>
  );
}
