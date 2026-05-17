import { type ReactNode } from 'react';
import { BrandPanel } from './BrandPanel';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="w-1/2">
        <BrandPanel />
      </div>
      <div className="flex w-1/2 items-center justify-center bg-white p-8">
        <div className="w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
}
