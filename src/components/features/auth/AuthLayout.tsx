import { type ReactNode } from 'react';
import { BrandPanel } from './BrandPanel';
import { LogoIcon } from '@/src/components/ui/Logo';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 md:block">
        <BrandPanel />
      </div>
      <div className="flex w-full items-center justify-center bg-white p-8 md:w-1/2">
        <div className="w-full max-w-[440px]">
          {/* Brand mark for small screens, where the gradient panel is hidden. */}
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <LogoIcon size={40} />
            <span className="text-[22px] font-semibold tracking-tight text-[#1a1a1a]">Receiptly</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
