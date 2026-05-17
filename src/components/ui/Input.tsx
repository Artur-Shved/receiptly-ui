'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  isFilled?: boolean;
}

export function Input({
  label,
  error,
  showPasswordToggle = false,
  isFilled = false,
  type,
  className = '',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  const borderClass = error
    ? 'border-[#A32D2D]'
    : isFilled
      ? 'border-[#d1d5db]'
      : 'border-[#e5e7eb]';

  const hasSuffix = showPasswordToggle || (isFilled && !error);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[13px] text-gray-600">{label}</label>
      )}
      <div className="relative">
        <input
          {...props}
          type={inputType}
          className={[
            'h-[42px] w-full rounded-lg border bg-white px-3 text-sm outline-none',
            'transition-colors focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]',
            hasSuffix ? 'pr-10' : '',
            borderClass,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {!showPasswordToggle && isFilled && !error && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B6D11]">
            <Check size={16} />
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-[12px] text-[#A32D2D]">{error}</p>
      )}
    </div>
  );
}
