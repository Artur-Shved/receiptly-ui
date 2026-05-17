'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/src/components/features/auth/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Banner } from '@/src/components/ui/Banner';
import { useForgotPassword } from '@/src/hooks/useAuth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { sendResetEmail, isLoading, error, lastSentAt, canResend } =
    useForgotPassword();

  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (canResend || !lastSentAt) return;
    const tick = () => {
      const remaining = Math.ceil((lastSentAt + 60_000 - Date.now()) / 1000);
      setCountdown(remaining > 0 ? remaining : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [canResend, lastSentAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !canResend) return;
    await sendResetEmail({ email });
    router.push(`/forgot-password/sent?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthLayout>
      <div>
        <Link
          href="/login"
          className="mb-6 block text-[13px] text-gray-500 hover:text-gray-700"
        >
          ← Назад до входу
        </Link>

        <h1 className="mb-1 text-[24px] font-medium">Скидання пароля</h1>
        <p className="mb-6 text-[14px] text-gray-500">
          Введіть email вашого акаунту — надішлемо інструкції для відновлення
        </p>

        {error && (
          <div className="mb-4">
            <Banner variant="error">{error}</Banner>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {!canResend ? (
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-gray-200 py-[14px] px-4 text-sm text-gray-400"
            >
              Повторний запит через {countdown} секунд
            </button>
          ) : (
            <Button type="submit" isLoading={isLoading}>
              Надіслати інструкції
            </Button>
          )}
        </form>

        <div className="mt-4">
          <Banner variant="info">
            Лист надсилається незалежно від того, чи зареєстрований цей email
          </Banner>
        </div>
      </div>
    </AuthLayout>
  );
}
