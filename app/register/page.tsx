'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/src/components/features/auth/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Banner } from '@/src/components/ui/Banner';
import { PasswordStrengthIndicator } from '@/src/components/ui/PasswordStrengthIndicator';
import { useRegister } from '@/src/hooks/useAuth';
import { ApiError } from '@/src/types/api.types';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface TouchedState {
  name: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
}

function validateField(
  field: keyof FormState,
  values: FormState,
): string | null {
  switch (field) {
    case 'name':
      return values.name.trim() ? null : "Введіть ваше ім'я";
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
        ? null
        : 'Введіть коректний email';
    case 'password':
      return values.password.length >= 8
        ? null
        : 'Пароль має містити мінімум 8 символів';
    case 'confirmPassword':
      return values.password === values.confirmPassword
        ? null
        : 'Паролі не збігаються';
    default:
      return null;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, setError } = useRegister();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState<TouchedState>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [duplicateEmail, setDuplicateEmail] = useState(false);

  const getFieldError = (field: keyof FormState) => {
    if (!touched[field]) return undefined;
    const err = validateField(field, form);
    return err ?? undefined;
  };

  const isFieldFilled = (field: keyof FormState) =>
    touched[field] && !validateField(field, form);

  const handleBlur = (field: keyof FormState) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setDuplicateEmail(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = {
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    const fields: (keyof FormState)[] = ['name', 'email', 'password', 'confirmPassword'];
    const hasErrors = fields.some((f) => validateField(f, form));
    if (hasErrors) return;

    setDuplicateEmail(false);
    try {
      await register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDuplicateEmail(true);
      }
    }
  };

  return (
    <AuthLayout>
      <div>
        <Link
          href="/welcome"
          className="mb-6 block text-[13px] text-gray-500 hover:text-gray-700"
        >
          ← Назад
        </Link>

        <h1 className="mb-1 text-[24px] font-medium">Новий акаунт</h1>
        <p className="mb-6 text-[14px] text-gray-500">
          Заповніть форму для створення акаунту
        </p>

        {duplicateEmail && (
          <div className="mb-4">
            <Banner variant="error">
              Цей email вже використовується.{' '}
              <Link
                href={`/login?email=${encodeURIComponent(form.email)}`}
                className="underline"
              >
                Увійти з цим email
              </Link>
            </Banner>
          </div>
        )}
        {error && !duplicateEmail && (
          <div className="mb-4">
            <Banner variant="error">{error}</Banner>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Ім'я"
            type="text"
            placeholder="Ваше ім'я"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={getFieldError('name')}
            isFilled={isFieldFilled('name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={getFieldError('email')}
            isFilled={isFieldFilled('email')}
          />
          <div>
            <Input
              label="Пароль"
              showPasswordToggle
              placeholder="Мінімум 8 символів"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              error={getFieldError('password')}
            />
            <PasswordStrengthIndicator password={form.password} />
          </div>
          <Input
            label="Підтвердження пароля"
            showPasswordToggle
            placeholder="Повторіть пароль"
            value={form.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            error={getFieldError('confirmPassword')}
            isFilled={isFieldFilled('confirmPassword')}
          />

          <Button type="submit" isLoading={isLoading} className="mt-2">
            Створити акаунт
          </Button>
        </form>

        <p className="mt-4 text-center text-[14px] text-gray-500">
          Вже маєте акаунт?{' '}
          <Link href="/login" className="text-[#1a1a1a] underline">
            Увійти
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
