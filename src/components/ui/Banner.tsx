'use client';

import { type ReactNode } from 'react';
import { Info, AlertCircle, AlertTriangle } from 'lucide-react';

type Variant = 'info' | 'error' | 'warning';

interface BannerProps {
  variant: Variant;
  children: ReactNode;
}

const CONFIG: Record<Variant, { bg: string; text: string; icon: typeof Info }> = {
  info: { bg: '#E6F1FB', text: '#0C447C', icon: Info },
  error: { bg: '#FCEBEB', text: '#A32D2D', icon: AlertCircle },
  warning: { bg: '#FAEEDA', text: '#854F0B', icon: AlertTriangle },
};

export function Banner({ variant, children }: BannerProps) {
  const { bg, text, icon: Icon } = CONFIG[variant];
  return (
    <div
      className="flex items-start gap-2 rounded-lg p-[10px_12px] text-[12px]"
      style={{ backgroundColor: bg, color: text }}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
