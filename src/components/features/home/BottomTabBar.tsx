'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, PieChart, Settings } from 'lucide-react';

interface Tab {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: '/home',
    label: 'Головна',
    icon: <Home size={20} />,
    isActive: (p) => p === '/home',
  },
  {
    href: '/receipts',
    label: 'Чеки',
    icon: <Receipt size={20} />,
    isActive: (p) => p === '/receipts' || p.startsWith('/receipts/'),
  },
  {
    href: '/statistics',
    label: 'Статистика',
    icon: <PieChart size={20} />,
    isActive: (p) => p === '/statistics',
  },
  {
    href: '/settings',
    label: 'Налаштування',
    icon: <Settings size={20} />,
    isActive: (p) => p.startsWith('/settings'),
  },
];

/**
 * Mobile-only bottom navigation (hidden from md: up, where TopNav's own
 * center links take over). Fixed to the viewport bottom with a safe-area
 * inset for iOS home-indicator devices; pair with `pb-16 md:pb-0` on the
 * page's scroll container so content never sits under it.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex items-stretch justify-around border-t border-[#e5e7eb] bg-white md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => {
        const active = tab.isActive(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
            style={{ color: active ? 'var(--brand)' : '#9ca3af' }}
          >
            {tab.icon}
            <span className="text-[10.5px]" style={{ fontWeight: active ? 600 : 400 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
