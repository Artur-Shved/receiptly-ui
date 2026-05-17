'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, LogOut } from 'lucide-react';
import { TopNav } from '@/src/components/features/home/TopNav';
import { Button } from '@/src/components/ui/Button';
import { Banner } from '@/src/components/ui/Banner';
import { useStores } from '@/src/hooks/useStores';
import { useLogout } from '@/src/hooks/useAuth';
import type { Store } from '@/src/types/store.types';

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

export default function StoresPage() {
  const { stores, isLoading, error, createStore, updateStore, removeStore } = useStores();
  const { logout } = useLogout();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // add form state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [isAddLoading, setIsAddLoading] = useState(false);

  // inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [isEditLoading, setIsEditLoading] = useState(false);

  // delete state
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [orphanInfo, setOrphanInfo] = useState<{ name: string; count: number } | null>(null);

  const systemStores = stores.filter((s) => s.userId === null);
  const userStores = stores.filter((s) => s.userId !== null);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) { setAddError('Введіть назву магазину'); return; }
    setIsAddLoading(true);
    const { error: err } = await createStore(name);
    setIsAddLoading(false);
    if (err) { setAddError(err); return; }
    setNewName('');
    setIsAdding(false);
    setAddError('');
  }

  function startEdit(store: Store) {
    setEditingId(store.id);
    setEditName(store.name);
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditError('');
  }

  async function handleEdit() {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) { setEditError('Введіть назву'); return; }
    setIsEditLoading(true);
    const { error: err } = await updateStore(editingId, name);
    setIsEditLoading(false);
    if (err) { setEditError(err); return; }
    cancelEdit();
  }

  async function handleDelete() {
    if (!deletingStore) return;
    setDeleteError('');
    setIsDeleteLoading(true);
    const result = await removeStore(deletingStore.id);
    setIsDeleteLoading(false);
    if (result.error) { setDeleteError(result.error); return; }
    const storeName = deletingStore.name;
    setDeletingStore(null);
    if ((result.receiptsCount ?? 0) > 0) {
      setOrphanInfo({ name: storeName, count: result.receiptsCount! });
    }
  }

  const showUserSection = userStores.length > 0 || isAdding;

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="mx-auto w-full max-w-[1024px] flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[22px] font-medium">Магазини</h1>
          <Button
            fullWidth={false}
            icon={<Plus size={16} />}
            onClick={() => { setIsAdding(true); setAddError(''); }}
            disabled={isAdding}
          >
            Додати магазин
          </Button>
        </div>

        {error && (
          <div className="mb-4">
            <Banner variant="error">{error}</Banner>
          </div>
        )}

        {orphanInfo && (
          <div className="mb-4">
            <Banner variant="warning">
              Магазин «{orphanInfo.name}» видалено.{' '}
              {orphanInfo.count === 1
                ? '1 чек залишився без магазину.'
                : `${orphanInfo.count} чеків залишились без магазину.`}
            </Banner>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-[14px] text-gray-400">
            Завантаження...
          </div>
        ) : (
          <>
            {/* System stores */}
            {systemStores.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-[12px] font-medium uppercase tracking-wide text-gray-400">
                  Системні
                </h2>
                <div className="rounded-xl border border-[#e5e7eb]">
                  {systemStores.map((store, i) => (
                    <div
                      key={store.id}
                      className={[
                        'flex items-center justify-between px-4 py-3',
                        i < systemStores.length - 1 ? 'border-b border-[#e5e7eb]' : '',
                      ].join(' ')}
                    >
                      <span className="text-[14px] text-gray-600">{store.name}</span>
                      <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[11px] text-gray-400">
                        системний
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* User stores */}
            <section>
              <h2 className="mb-3 text-[12px] font-medium uppercase tracking-wide text-gray-400">
                Мої магазини
              </h2>

              {!showUserSection ? (
                <div className="flex flex-col items-center rounded-xl border border-[#e5e7eb] py-12">
                  <p className="text-[14px] text-gray-400">
                    Ви ще не додали жодного магазину
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#e5e7eb]">
                  {userStores.map((store, i) => {
                    const isLast = i === userStores.length - 1 && !isAdding;
                    const isEditing = editingId === store.id;
                    return (
                      <div
                        key={store.id}
                        className={[
                          'px-4 py-3',
                          !isLast ? 'border-b border-[#e5e7eb]' : '',
                        ].join(' ')}
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
                              {store.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEdit(store)}
                              className="text-gray-400 transition-colors hover:text-gray-700"
                              aria-label="Редагувати"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => { setDeletingStore(store); setDeleteError(''); }}
                              className="text-gray-400 transition-colors hover:text-[#A32D2D]"
                              aria-label="Видалити"
                            >
                              <Trash2 size={15} />
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
                          placeholder="Назва магазину"
                          className="h-[34px] flex-1 rounded-lg border border-[#1a1a1a] px-3 text-[14px] outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-[#1a1a1a]"
                        />
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
            </section>
          </>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deletingStore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => !isDeleteLoading && setDeletingStore(null)}
        >
          <div
            className="w-[400px] rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-[18px] font-medium">Видалити магазин?</h2>
            <p className="mb-2 text-[14px] text-gray-500">
              «{deletingStore.name}» буде видалено. Пов'язані чеки залишаться в базі.
            </p>
            {deleteError && (
              <p className="mb-4 text-[13px] text-[#A32D2D]">{deleteError}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                fullWidth={false}
                onClick={() => setDeletingStore(null)}
                disabled={isDeleteLoading}
              >
                Скасувати
              </Button>
              <Button
                variant="danger"
                fullWidth={false}
                isLoading={isDeleteLoading}
                onClick={handleDelete}
              >
                Видалити
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout modal */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}
