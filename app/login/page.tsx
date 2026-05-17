'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/src/components/features/auth/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Banner } from '@/src/components/ui/Banner';
import { useLogin } from '@/src/hooks/useAuth';

function LoginForm() {
  const searchParams = useSearchParams();
  const { login, isLoading, error, isLocked, lockedUntil } = useLogin();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isLocked || !lockedUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      setCountdown(remaining > 0 ? remaining : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isLocked, lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      await login({ email, password });
    } catch {
      // error state handled by hook
    }
  };

  return (
    <div>
      <Link
        href="/welcome"
        className="mb-6 block text-[13px] text-gray-500 hover:text-gray-700"
      >
        ← Назад
      </Link>

      <h1 className="mb-1 text-[24px] font-medium">З поверненням</h1>
      <p className="mb-6 text-[14px] text-gray-500">
        Введіть ваші дані для входу
      </p>

      {error && (
        <div className="mb-4">
          <Banner variant="error">{error}</Banner>
        </div>
      )}
      {isLocked && (
        <div className="mb-4">
          <Banner variant="warning">
            Забагато спроб — зачекайте {countdown} с
          </Banner>
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
        <div>
          <Input
            label="Пароль"
            showPasswordToggle
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="mt-1 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[13px] text-gray-500 hover:text-gray-700"
            >
              Забули пароль?
            </Link>
          </div>
        </div>

        {isLocked ? (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-gray-200 py-[14px] px-4 text-sm text-gray-400"
          >
            Спробуйте через {countdown} секунд
          </button>
        ) : (
          <Button type="submit" isLoading={isLoading} className="mt-2">
            Увійти
          </Button>
        )}
      </form>

      <p className="mt-4 text-center text-[14px] text-gray-500">
        Ще немає акаунту?{' '}
        <Link href="/register" className="text-[#1a1a1a] underline">
          Зареєструватись
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
