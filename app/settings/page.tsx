'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, CreditCard, Tag, ShoppingBasket, ChevronRight } from 'lucide-react';

const ITEMS = [
  { href: '/settings/stores', label: 'Магазини', icon: Store, bg: '#E1F5EE', color: '#0F6E56' },
  { href: '/settings/payment-methods', label: 'Методи оплати', icon: CreditCard, bg: '#E6F1FB', color: '#185FA5' },
  { href: '/settings/transaction-categories', label: 'Категорії транзакцій', icon: Tag, bg: '#FAEEDA', color: '#854F0B' },
  { href: '/settings/item-categories', label: 'Категорії товарів', icon: ShoppingBasket, bg: '#EAF3DE', color: '#3B6D11' },
] as const;

/**
 * Mobile-only Settings landing — vertical drill-down list of sections.
 * Desktop has no use for this route (the sidebar already lists everything),
 * so it redirects straight to the first section.
 */
export default function SettingsHomePage() {
  const router = useRouter();

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      router.replace('/settings/stores');
    }
  }, [router]);

  return (
    <div className="md:hidden">
      <h1 className="mb-4 text-[18px] font-medium text-[#1a1a1a]">Налаштування</h1>

      <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#e5e7eb] px-4 py-3">
          <span className="text-[12px] uppercase tracking-[0.06em] text-[#9ca3af]">Довідники</span>
        </div>
        {ITEMS.map(({ href, label, icon: Icon, bg, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-3 last:border-b-0 hover:bg-[#F7F7F7]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: bg, color }}
            >
              <Icon size={16} />
            </div>
            <span className="flex-1 text-[14px] text-[#1a1a1a]">{label}</span>
            <ChevronRight size={16} className="text-[#C7C7CC]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
