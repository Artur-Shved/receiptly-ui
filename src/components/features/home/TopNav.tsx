'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt, Camera, User, LogOut } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useLogout } from '@/src/hooks/useAuth';

interface TopNavProps {
  onLogoutClick: () => void;
}

function navClass(active: boolean) {
  return active
    ? 'border-b-2 border-[#1a1a1a] pb-1 text-[14px] font-medium text-[#1a1a1a]'
    : 'border-b-2 border-transparent pb-1 text-[14px] text-gray-500 hover:text-gray-700';
}

export function TopNav({ onLogoutClick }: TopNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[#e5e7eb] bg-white px-6">
      <div className="flex items-center gap-2">
        <Receipt size={20} color="#1a1a1a" />
        <span className="text-[16px] font-medium">Receiptly</span>
      </div>

      <nav className="flex gap-6">
        <Link href="/home" className={navClass(pathname === '/home')}>
          Головна
        </Link>
        <Link href="/home/stores" className={navClass(pathname === '/home/stores')}>
          Магазини
        </Link>
        <Link href="#" className={navClass(false)}>
          Статистика
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <Button
          fullWidth={false}
          icon={<Camera size={16} />}
          className="py-2 px-3 text-xs"
        >
          Додати чек
        </Button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5e7eb] text-[#1a1a1a] hover:bg-[#d1d5db]"
          >
            <User size={16} />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-11 z-20 w-48 rounded-lg border border-[#e5e7eb] bg-white shadow-md">
                <Link
                  href="#"
                  className="flex items-center gap-2 px-4 py-3 text-[14px] text-gray-700 hover:bg-[#F7F7F7]"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={16} />
                  Профіль
                </Link>
                <div className="border-t border-[#e5e7eb]" />
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogoutClick();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-[14px] text-[#A32D2D] hover:bg-[#F7F7F7]"
                >
                  <LogOut size={16} />
                  Вийти з акаунту
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
