'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { AuthLayout } from '@/src/components/features/auth/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { useForgotPassword } from '@/src/hooks/useAuth';

function SentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const { sendResetEmail, isLoading, lastSentAt, canResend } = useForgotPassword();
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

  const handleResend = () => {
    if (!email || !canResend) return;
    sendResetEmail({ email });
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: '#E6F1FB' }}
      >
        <Mail size={32} color="#185FA5" />
      </div>

      <h1 className="mb-2 text-[24px] font-medium">Перевірте вашу пошту</h1>
      <p className="text-[14px] text-gray-500">
        Надіслали інструкції на{' '}
        <span className="font-medium text-[#1a1a1a]">{email}</span>
      </p>
      <p className="mt-1 text-[13px] text-gray-400">
        Посилання дійсне 1 годину
      </p>

      <div className="mt-6 flex w-full flex-col gap-3">
        {!canResend ? (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-[#d1d5db] bg-transparent py-[13px] px-4 text-sm text-gray-400"
          >
            Повторний запит через {countdown} с
          </button>
        ) : (
          <Button variant="secondary" onClick={handleResend} isLoading={isLoading}>
            Надіслати ще раз
          </Button>
        )}
        <Link
          href="/login"
          className="text-center text-[14px] text-gray-500 underline hover:text-gray-700"
        >
          Повернутись до входу
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordSentPage() {
  return (
    <AuthLayout>
      <Suspense>
        <SentContent />
      </Suspense>
    </AuthLayout>
  );
}
