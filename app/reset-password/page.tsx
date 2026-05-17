'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { AuthLayout } from '@/src/components/features/auth/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Banner } from '@/src/components/ui/Banner';
import { PasswordStrengthIndicator } from '@/src/components/ui/PasswordStrengthIndicator';
import { useResetPassword } from '@/src/hooks/useAuth';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isLoading, error } = useResetPassword();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [tokenExpired, setTokenExpired] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Banner variant="error">
          Посилання недійсне або протерміноване
        </Banner>
        <Link href="/forgot-password">
          <Button>Надіслати новий лист</Button>
        </Link>
      </div>
    );
  }

  if (tokenExpired) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Banner variant="error">
          Посилання недійсне або протерміноване
        </Banner>
        <Link href="/forgot-password">
          <Button>Надіслати новий лист</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError('');

    if (newPassword !== confirmPassword) {
      setConfirmError('Паролі не збігаються');
      return;
    }
    if (newPassword.length < 8) {
      return;
    }

    try {
      await resetPassword({ token, newPassword, confirmPassword });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('used')
      ) {
        setTokenExpired(true);
      }
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-[24px] font-medium">Новий пароль</h1>
      <p className="mb-6 text-[14px] text-gray-500">
        Придумайте новий пароль для вашого акаунту
      </p>

      {error && !tokenExpired && (
        <div className="mb-4">
          <Banner variant="error">{error}</Banner>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Input
            label="Новий пароль"
            showPasswordToggle
            placeholder="Мінімум 8 символів"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <PasswordStrengthIndicator password={newPassword} />
        </div>
        <Input
          label="Підтвердження пароля"
          showPasswordToggle
          placeholder="Повторіть пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmError || undefined}
          required
        />

        <Button type="submit" isLoading={isLoading} icon={<Lock size={16} />} className="mt-2">
          Зберегти пароль
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
