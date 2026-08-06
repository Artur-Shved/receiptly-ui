'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

/** Mobile-only "← Налаштування" back link, shown above every Settings sub-page. */
export function MobileSettingsBackHeader() {
  return (
    <Link
      href="/settings"
      className="flex items-center gap-1 border-b border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] text-gray-500 md:hidden"
    >
      <ChevronLeft size={15} />
      Налаштування
    </Link>
  );
}
