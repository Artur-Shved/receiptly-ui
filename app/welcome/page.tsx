'use client';

import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/src/components/features/auth/AuthLayout';
import { Button } from '@/src/components/ui/Button';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <AuthLayout>
      <div>
        <h1 className="mb-2 text-[24px] font-medium">Ласкаво просимо</h1>
        <p className="mb-8 text-[14px] text-gray-500">
          Оберіть дію для продовження
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push('/register')}>
            Зареєструватись
          </Button>
          <Button variant="secondary" onClick={() => router.push('/login')}>
            Увійти
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
