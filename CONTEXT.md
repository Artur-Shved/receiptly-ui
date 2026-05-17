# receiptly-ui/CONTEXT.md — FE Контекст

> Власник: FE Agent. Оновлюється після кожної імплементованої задачі.
> Tech Lead читає цей файл перед декомпозицією задач.

---

## Оновлено: 2026-05-17 — Auth Module

### Існуючі Pages

- `/welcome` — `app/welcome/page.tsx` — стартовий екран (Register / Login кнопки)
- `/register` — `app/register/page.tsx` — форма реєстрації (4 поля, password strength, 409 handling)
- `/login` — `app/login/page.tsx` — форма входу (rate limit 3 спроби → 30с блокування)
- `/forgot-password` — `app/forgot-password/page.tsx` — email для скидання (rate limit 60с)
- `/forgot-password/sent` — `app/forgot-password/sent/page.tsx` — підтвердження відправки
- `/reset-password` — `app/reset-password/page.tsx` — форма нового пароля (читає ?token= з URL)
- `/home` — `app/home/page.tsx` — головний екран (TopNav, статистика, empty state, logout modal)
- `/` → redirect до `/welcome`

---

### Існуючі Components

#### UI (базові)
- **Button** (`src/components/ui/Button.tsx`)
  Props: variant('primary'|'secondary'|'danger'), isLoading, fullWidth, icon, +всі HTML button props

- **Input** (`src/components/ui/Input.tsx`)
  Props: label, error, showPasswordToggle(eye icon), isFilled(check icon), +всі HTML input props

- **PasswordStrengthIndicator** (`src/components/ui/PasswordStrengthIndicator.tsx`)
  Props: password(string) — 4 плашки (weak/medium/strong/very strong)

- **Banner** (`src/components/ui/Banner.tsx`)
  Props: variant('info'|'error'|'warning'), children

#### Features
- **AuthLayout** (`src/components/features/auth/AuthLayout.tsx`)
  Two-column layout: BrandPanel (left) + centered card (right). Wrapper для всіх auth сторінок.

- **BrandPanel** (`src/components/features/auth/BrandPanel.tsx`)
  Темна ліва панель з лого і підзаголовком Receiptly

- **TopNav** (`src/components/features/home/TopNav.tsx`)
  Props: onLogoutClick() — top navigation bar з лого, nav links, avatar dropdown

---

### Існуючі Hooks

- **useRegister()** → `{ register, isLoading, error, setError }` (`src/hooks/useAuth.ts`)
  Для: реєстрації нового користувача

- **useLogin()** → `{ login, isLoading, error, attempts, isLocked, lockedUntil, setError }` (`src/hooks/useAuth.ts`)
  Для: входу з rate limiting (3 спроби → 30с блокування)

- **useForgotPassword()** → `{ sendResetEmail, isLoading, error, lastSentAt, canResend }` (`src/hooks/useAuth.ts`)
  Для: запиту скидання пароля (rate limit 60с)

- **useResetPassword()** → `{ resetPassword, isLoading, error }` (`src/hooks/useAuth.ts`)
  Для: встановлення нового пароля за токеном

- **useLogout()** → `{ logout }` (`src/hooks/useAuth.ts`)
  Для: виходу (fire-and-forget API call, очищає access token)

---

### Існуючі API функції

- `authApi.register(dto)` → `Promise<AuthResponse>` (`src/api/auth.api.ts`)
- `authApi.login(dto)` → `Promise<AuthResponse>`
- `authApi.logout()` → `Promise<void>`
- `authApi.refresh()` → `Promise<AuthResponse>`
- `authApi.forgotPassword(dto)` → `Promise<void>`
- `authApi.resetPassword(dto)` → `Promise<AuthResponse>`

---

### Існуючі Types

- **RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, AuthResponse** (`src/types/auth.types.ts`)
- **ApiError** (`src/types/api.types.ts`) — extends Error, має status: number

---

### Існуючі Utils

- `setAccessToken(token)`, `getAccessToken()` — `src/api/client.ts` — in-memory access token store
- `apiClient.get/post/patch/delete()` — HTTP клієнт з credentials:include, 401 interceptor (silent refresh)

---

### Спільні утиліти (можна повторно використовувати)

- **AuthLayout** + **BrandPanel** — для будь-якого нового auth екрану
- **Button, Input, Banner, PasswordStrengthIndicator** — базові UI компоненти
- **ApiError** клас — для обробки API помилок у будь-якому хуку
- `apiClient` — для будь-яких нових API викликів

---

### Змінні середовища (.env)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

---

### Важливі архітектурні рішення

- API виклики ТІЛЬКИ через api/ шар, ніколи напряму в компонентах
- Бізнес логіка в hooks/, не в компонентах
- Access token — in-memory (module-level var в client.ts), втрачається при refresh сторінки
- Refresh token — httpOnly cookie (встановлює BE), автоматично підхоплюється через credentials:include
- При 401 → automatic silent refresh → retry (в apiClient, 1 спроба)
- Next.js middleware (middleware.ts) перевіряє наявність refreshToken cookie для /home
- Next.js App Router: всі інтерактивні компоненти мають 'use client'
- useSearchParams() завжди в Suspense boundary
