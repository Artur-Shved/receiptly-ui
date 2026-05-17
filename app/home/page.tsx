'use client';

import { useState } from 'react';
import { Camera, Receipt } from 'lucide-react';
import { TopNav } from '@/src/components/features/home/TopNav';
import { Button } from '@/src/components/ui/Button';
import { useLogout } from '@/src/hooks/useAuth';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброго ранку';
  if (hour >= 12 && hour < 18) return 'Доброго дня';
  return 'Доброго вечора';
}

function getCurrentMonth(): string {
  return new Date().toLocaleString('uk-UA', { month: 'long' });
}

function formatDate(): string {
  return new Date().toLocaleDateString('uk-UA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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
          <Button
            variant="secondary"
            fullWidth={false}
            onClick={onCancel}
          >
            Скасувати
          </Button>
          <Button
            variant="danger"
            fullWidth={false}
            icon={<span>↪</span>}
            onClick={onConfirm}
          >
            Вийти
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useLogout();

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="mx-auto w-full max-w-[1024px] flex-1 px-6 py-8">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-[22px] font-medium">
            {getGreeting()}, Користувачу
          </h1>
          <p className="mt-1 text-[14px] text-gray-500">{formatDate()}</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#e5e7eb] p-5">
            <p className="text-[12px] uppercase tracking-wide text-gray-400">
              Витрати у {getCurrentMonth()}
            </p>
            <p className="mt-2 text-[28px] font-medium">0 ₴</p>
            <p className="mt-1 text-[13px] text-gray-400">Даних ще немає</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] p-5">
            <p className="text-[12px] uppercase tracking-wide text-gray-400">
              Кількість чеків
            </p>
            <p className="mt-2 text-[28px] font-medium">0</p>
            <p className="mt-1 text-[13px] text-gray-400">
              за поточний місяць
            </p>
          </div>
        </div>

        {/* Recent receipts header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Останні чеки</h2>
          <a href="#" className="text-[13px] text-gray-500 hover:underline">
            Переглянути всі
          </a>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center rounded-xl border border-[#e5e7eb] py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F7F7]">
            <Receipt size={32} color="#9ca3af" />
          </div>
          <h3 className="mb-2 text-[16px] font-medium">Поки немає чеків</h3>
          <p className="mb-6 max-w-xs text-center text-[14px] text-gray-500">
            Додайте перший чек, щоб почати відстежувати витрати
          </p>
          <Button fullWidth={false} icon={<Camera size={16} />}>
            Додати перший чек
          </Button>
        </div>
      </main>

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
