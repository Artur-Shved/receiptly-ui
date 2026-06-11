'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const VARIANTS = {
  primary:
    'bg-[var(--brand)] text-white py-[14px] px-4 font-medium hover:bg-[var(--brand-strong)] active:scale-[0.99]',
  secondary:
    'bg-[#F0F0F3] text-[#1a1a1a] py-[13px] px-4 hover:bg-[#E6E7EB] active:scale-[0.99]',
  danger: 'bg-[#FCEBEB] text-[#A32D2D] py-[13px] px-4 font-medium hover:bg-[#F8DCDC]',
} as const;

export function Button({
  variant = 'primary',
  isLoading = false,
  fullWidth = true,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={[
        'flex items-center justify-center gap-2 rounded-[10px] text-sm transition-[background-color,transform] duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
