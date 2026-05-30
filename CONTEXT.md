# receiptly-ui/CONTEXT.md — FE Контекст

> Власник: FE Agent. Оновлюється після кожної імплементованої задачі.
> Tech Lead читає цей файл перед декомпозицією задач.

---

## Оновлено: 2026-05-28 — Receipts: optional meta + inline store create

### Зміни
- `Receipt`, `CreateReceiptDto`, `UpdateReceiptDto`: `storeId`, `paymentMethodId`, `transactionCategoryId` тепер `string | null`. Relation objects (`store`, `paymentMethod`, `transactionCategory`) також nullable.
- Новий компонент **SearchableStoreSelect** (`src/components/features/receipts/SearchableStoreSelect.tsx`) — combobox з пошуком, clearable, inline-create опцією "+ Додати «X» як новий магазин" при відсутності точного матчу.
- `useStores().createStore` тепер повертає `{ store?: Store; error?: string }` (раніше було `{ error? }`).
- `/receipts/upload` Step 2: поля Магазин / Метод оплати / Категорія транзакції зроблено опціональними. Магазин використовує SearchableStoreSelect, інші — `<select>` з опцією "Без X". Прибрано блокування "Заповніть усі поля".
- `/receipts` EditModal: SearchableStoreSelect для магазину, селекти з "Без X" опцією для решти; null-safe state.
- Список чеків + DetailsModal вже null-safe (відображають "—" для null).

---

## Оновлено: 2026-05-17 — Receipts Module

### Існуючі Pages

- `/receipts` — `app/receipts/page.tsx` — таблиця чеків з пошуком, DetailsModal/EditModal/DeleteModal, пагінація ("Завантажити ще"), empty/error states
- `/receipts/upload` — `app/receipts/upload/page.tsx` — 4-крокова форма: вибір файлу → метадані+LLM → preview товарів → success
- `/settings/stores` — `app/settings/stores/page.tsx` — управління магазинами (системні locked, власні: modal edit + delete з orange banner якщо receiptsCount > 0)
- `/settings/payment-methods` — `app/settings/payment-methods/page.tsx` — modal CRUD з delete (нейтральна CreditCard іконка, без type)
- `/settings/transaction-categories` — `app/settings/transaction-categories/page.tsx` — системні locked, власні pencil-only (no delete до V2)
- `/settings/item-categories` — `app/settings/item-categories/page.tsx` — системні locked, власні pencil+trash; DeleteModal Variant A/B (itemsCount > 0 → orange warning)
- `/welcome` — `app/welcome/page.tsx` — стартовий екран (Register / Login кнопки)
- `/register` — `app/register/page.tsx` — форма реєстрації (4 поля, password strength, 409 handling)
- `/login` — `app/login/page.tsx` — форма входу (rate limit 3 спроби → 30с блокування)
- `/forgot-password` — `app/forgot-password/page.tsx` — email для скидання (rate limit 60с)
- `/forgot-password/sent` — `app/forgot-password/sent/page.tsx` — підтвердження відправки
- `/reset-password` — `app/reset-password/page.tsx` — форма нового пароля (читає ?token= з URL)
- `/home` — `app/home/page.tsx` — головний екран (TopNav, статистика, empty state, logout modal)
- `/settings/*` — `app/settings/layout.tsx` — shared settings layout (TopNav + SettingsSidebar + logout modal)
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
  Props: onLogoutClick() — top nav з лого, nav links (Головна, Чеки, Статистика), "Додати чек" → /receipts/upload, avatar dropdown (Профіль, Налаштування → /settings/stores, Вийти)

- **SettingsSidebar** (`src/components/features/settings/SettingsSidebar.tsx`)
  Sidebar for /settings/* routes. Sections: "Довідники" (Магазини, Методи оплати, Категорії транзакцій, Категорії товарів) + "Акаунт" (Профіль). Active item highlighted via usePathname().

---

### Існуючі Hooks

- **useReceipts()** → `{ receipts, total, page, hasMore, isLoading, error, loadMore, createReceipt, updateReceipt, removeReceipt, refresh }` (`src/hooks/useReceipts.ts`)
  Для: список чеків з пагінацією. loadMore → appends. Всі мутації повертають `{ error? }`.

- **useItemCategories()** → `{ categories, isLoading, error, createCategory, updateCategory, removeCategory, removeConfirmedCategory }` (`src/hooks/useItemCategories.ts`)
  Для: управління категоріями товарів. removeCategory → `{ itemsCount?, error? }`, removeConfirmedCategory → `{ error? }`

- **useTransactionCategories()** → `{ categories, isLoading, error, createCategory, updateCategory }` (`src/hooks/useTransactionCategories.ts`)
  Для: управління категоріями транзакцій.

- **usePaymentMethods()** → `{ methods, isLoading, error, createMethod, updateMethod, removeMethod }` (`src/hooks/usePaymentMethods.ts`)
  Для: управління методами оплати. List sorted by name після кожної операції.

- **useStores()** → `{ stores, isLoading, error, createStore, updateStore, removeStore }` (`src/hooks/useStores.ts`)
  Для: управління магазинами. createStore/updateStore повертають `{ error? }`, removeStore — `{ receiptsCount?, error? }`

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

- `receiptsApi.parse(file)` → `Promise<ParsedReceiptDto>` (`src/api/receipts.api.ts`) — multipart FormData
- `receiptsApi.getAll(page, limit)` → `Promise<ReceiptsListResponse>`
- `receiptsApi.getOne(id)` → `Promise<Receipt>`
- `receiptsApi.create(dto)` → `Promise<Receipt>`
- `receiptsApi.update(id, dto)` → `Promise<Receipt>`
- `receiptsApi.remove(id)` → `Promise<void>`
- `itemCategoriesApi.getAll()` → `Promise<ItemCategory[]>` (`src/api/item-categories.api.ts`)
- `itemCategoriesApi.create(dto)` → `Promise<ItemCategory>`
- `itemCategoriesApi.update(id, dto)` → `Promise<ItemCategory>`
- `itemCategoriesApi.remove(id)` → `Promise<RemoveItemCategoryResponse>` (повертає `{ itemsCount }`)
- `itemCategoriesApi.removeConfirmed(id)` → `Promise<void>`
- `transactionCategoriesApi.getAll()` → `Promise<TransactionCategory[]>` (`src/api/transaction-categories.api.ts`)
- `transactionCategoriesApi.create(dto)` → `Promise<TransactionCategory>`
- `transactionCategoriesApi.update(id, dto)` → `Promise<TransactionCategory>`
- `paymentMethodsApi.getAll()` → `Promise<PaymentMethod[]>` (`src/api/payment-methods.api.ts`)
- `paymentMethodsApi.create(dto)` → `Promise<PaymentMethod>`
- `paymentMethodsApi.update(id, dto)` → `Promise<PaymentMethod>`
- `paymentMethodsApi.remove(id)` → `Promise<void>`
- `storesApi.getAll()` → `Promise<Store[]>` (`src/api/stores.api.ts`)
- `storesApi.create(dto)` → `Promise<Store>`
- `storesApi.update(id, dto)` → `Promise<Store>`
- `storesApi.remove(id)` → `Promise<DeleteStoreResponse>`
- `authApi.register(dto)` → `Promise<AuthResponse>` (`src/api/auth.api.ts`)
- `authApi.login(dto)` → `Promise<AuthResponse>`
- `authApi.logout()` → `Promise<void>`
- `authApi.refresh()` → `Promise<AuthResponse>`
- `authApi.forgotPassword(dto)` → `Promise<void>`
- `authApi.resetPassword(dto)` → `Promise<AuthResponse>`

---

### Існуючі Types

- **Receipt, ReceiptItem, ReceiptsListResponse, CreateReceiptDto, UpdateReceiptDto, ParsedReceiptDto, ParsedItem** (`src/types/receipt.types.ts`)
- **ItemCategory, CreateItemCategoryDto, UpdateItemCategoryDto, RemoveItemCategoryResponse** (`src/types/item-category.types.ts`)
- **TransactionCategory, CreateTransactionCategoryDto, UpdateTransactionCategoryDto** (`src/types/transaction-category.types.ts`)
- **PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto** (`src/types/payment-method.types.ts`) — без type поля
- **Store, CreateStoreDto, UpdateStoreDto, DeleteStoreResponse** (`src/types/store.types.ts`)
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
- При 401 → automatic silent refresh → retry (в apiClient, 1 спроба). Якщо refresh теж провалився → редірект `window.location.href = '/login'` (skipped якщо вже на auth-сторінці)
- Next.js middleware (middleware.ts) перевіряє наявність refreshToken cookie для /home та /settings/*
- Next.js App Router: всі інтерактивні компоненти мають 'use client'
- useSearchParams() завжди в Suspense boundary
