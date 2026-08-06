'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  CreditCard,
  Tag,
  ShoppingBasket,
  User,
} from 'lucide-react';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const SECTIONS: SidebarSection[] = [
  {
    title: 'Довідники',
    items: [
      { icon: <Store size={16} />, label: 'Магазини', href: '/settings/stores' },
      { icon: <CreditCard size={16} />, label: 'Методи оплати', href: '/settings/payment-methods' },
      { icon: <Tag size={16} />, label: 'Категорії транзакцій', href: '/settings/transaction-categories' },
      { icon: <ShoppingBasket size={16} />, label: 'Категорії товарів', href: '/settings/item-categories' },
    ],
  },
  {
    title: 'Акаунт',
    items: [
      { icon: <User size={16} />, label: 'Профіль', href: '#' },
    ],
  },
];

function SidebarNavItem({ item, isActive }: { item: SidebarItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        'flex items-center gap-2 rounded-md px-2 py-[7px] text-[13px] transition-colors',
        isActive
          ? 'bg-[#F7F7F7] font-medium text-[#1a1a1a]'
          : 'text-[#6b7280] hover:bg-[#F7F7F7]',
      ].join(' ')}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

/** All nav items flattened, mobile horizontal-scroll tab strip. */
function MobileTabStrip() {
  const pathname = usePathname();
  const items = SECTIONS.flatMap((s) => s.items);

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[#e5e7eb] bg-white px-3 py-2 md:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={[
              'flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition-colors',
              isActive
                ? 'bg-[#1a1a1a] font-medium text-white'
                : 'bg-[#F7F7F7] text-[#6b7280]',
            ].join(' ')}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <>
      <MobileTabStrip />
      <aside
        className="hidden flex-shrink-0 border-r border-[#e5e7eb] md:block"
        style={{ width: '200px', padding: '20px 12px' }}
      >
        {SECTIONS.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-5' : ''}>
            <p className="mb-1 px-2 text-[11px] uppercase tracking-[0.06em] text-[#9ca3af]">
              {section.title}
            </p>
            <nav className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.label}
                  item={item}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>
          </div>
        ))}
      </aside>
    </>
  );
}
