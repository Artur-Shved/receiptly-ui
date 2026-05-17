'use client';

import { useState } from 'react';
import { TopNav } from '@/src/components/features/home/TopNav';
import { SettingsSidebar } from '@/src/components/features/settings/SettingsSidebar';
import { Button } from '@/src/components/ui/Button';
import { useLogout } from '@/src/hooks/useAuth';

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

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useLogout();

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <div className="flex flex-1">
        <SettingsSidebar />

        <main className="flex-1 bg-[#F7F7F7] p-6">
          {children}
        </main>
      </div>

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
