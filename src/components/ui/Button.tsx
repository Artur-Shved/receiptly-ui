'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const VARIANTS = {
  primary: 'bg-[#1a1a1a] text-white py-[14px] px-4 font-medium',
  secondary: 'bg-transparent border border-[#d1d5db] py-[13px] px-4',
  danger: 'bg-[#FCEBEB] text-[#A32D2D] py-[13px] px-4 font-medium',
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
        'flex items-center justify-center gap-2 rounded-lg text-sm transition-opacity',
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
