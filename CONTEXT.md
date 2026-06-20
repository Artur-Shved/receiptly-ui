# receiptly-ui/CONTEXT.md — FE Структурна карта

> Власник: FE Agent. Оновлюється після кожної задачі (тільки поточний стан, без хронології).
> Tech Lead і context-loader читають цей файл перед декомпозицією.

---

## Pages (Next.js App Router)

- `/` → redirect до `/welcome`
- `/welcome` — `app/welcome/page.tsx` — стартовий екран (Register / Login)
- `/register` — `app/register/page.tsx` — форма реєстрації (name/email/password, 409 handling)
- `/login` — `app/login/page.tsx` — форма входу (rate limit 3 спроби → 30с блокування)
- `/forgot-password` — `app/forgot-password/page.tsx` — email для скидання (rate limit 60с)
- `/forgot-password/sent` — підтвердження відправки
- `/reset-password` — `app/reset-password/page.tsx` — новий пароль (?token= з URL)
- `/home` — `app/home/page.tsx` — hero-картка витрат, quick actions (Фото/QR/Вручну), останні чеки
- `/receipts` — `app/receipts/page.tsx` — таблиця з групуванням по днях, server-side фільтри (пошук магазину з debounce 300ms, дата=останні 12 міс→dateFrom/dateTo, категорія), DetailsModal/EditModal/DeleteModal, пагінація
- `/receipts/upload` — `app/receipts/upload/page.tsx` — LLM multi-photo wizard: Фото→Обробка(спінер)→Перевірка(мета+товари)→Готово
- `/receipts/upload/manual` — `app/receipts/upload/manual/page.tsx` — ручний wizard: мета→товари→success
- `/receipts/upload/qr` — `app/receipts/upload/qr/page.tsx` — QR flow: upload→confirm→processing→preview→success/error
- `/statistics` — `app/statistics/page.tsx` — PeriodTabs, StatsGrid, DonutChart+TimelineChart, 3 BreakdownSection, FiltersModal
- `/settings/*` — `app/settings/layout.tsx` — shared layout (TopNav + SettingsSidebar)
- `/settings/stores` — системні locked, власні pencil+trash, DeleteModal Variant A/B
- `/settings/payment-methods` — modal CRUD з delete
- `/settings/transaction-categories` — системні locked, власні pencil-only
- `/settings/item-categories` — системні locked, власні pencil+trash, DeleteModal A/B (itemsCount)
- `middleware.ts` — захист /home, /receipts/*, /statistics, /settings/*

---

## Components

### UI (`src/components/ui/`)
- **Button** (`Button.tsx`) — variant: primary(brand-green)|secondary|danger; isLoading, fullWidth, icon
- **Input** (`Input.tsx`) — label, error, showPasswordToggle, isFilled; brand focus ring
- **Banner** (`Banner.tsx`) — variant: info|error|warning
- **PasswordStrengthIndicator** (`PasswordStrengthIndicator.tsx`) — 4 плашки (weak→very strong)
- **Skeleton** (`Skeleton.tsx`) — shimmer анімація

### Features — Auth (`src/components/features/auth/`)
- **AuthLayout** — two-column layout: BrandPanel(left) + centered card(right)
- **BrandPanel** — темна ліва панель з лого

### Features — Home (`src/components/features/home/`)
- **TopNav** (`TopNav.tsx`) — лого, nav links (Головна/Чеки/Статистика), "Додати чек" → AddReceiptChoiceModal, avatar dropdown (Профіль/Налаштування/Вийти)

### Features — Settings (`src/components/features/settings/`)
- **SettingsSidebar** — sections "Довідники" + "Акаунт"; active item via usePathname()

### Features — Receipts (`src/components/features/receipts/`)
- **AddReceiptChoiceModal** (`AddReceiptChoiceModal.tsx`) — 3 картки: Сфотографувати/QR/Вручну + info banner
- **SearchableStoreSelect** (`SearchableStoreSelect.tsx`) — combobox з пошуком, clearable, inline-create "+ Додати «X» як новий магазин"; бейдж «нова: {name}» коли є `suggestedStoreName`
- **SearchableEntitySelect** — generic combobox для payment methods / tx categories / item categories
- **ItemSubModal** — add/edit товару: originalAmount + discountAmount + live "Фінальна сума"; бейдж «нова: {name}» для suggestedCategoryName
- **ProcessingStages** — 3-stage progress (Декодування/Запит ДПС/Розпізнавання) для QR flow
- **DpsBadge** — badge `ДПС` (#E6F1FB/#0C447C) для полів що заповнені з реєстру

### Features — Statistics (`src/components/features/statistics/`)
- **PeriodTabs** — Тиждень/Місяць/Рік/Свій (custom → два date inputs); `presetRange(period)` helper
- **StatsGrid** — 3 cards (Витрати/Чеки/Середній чек) з trend ±%; skeleton
- **TimelineChart** — SVG bar chart, brand кольори, auto X-axis labels, hover tooltip
- **DonutChart** — Recharts PieChart, categoryColor palette, click → drill-down
- **BreakdownSection** — top-5 рядки з progress bar + percentage; click → DrillDownModal
- **FiltersModal** — split-panel мультивибір (620×560). Ліва панель (180px): 3 секції (Магазини/Кат. транзакцій/Кат. товарів) з кольоровою іконкою, preview перших 2 вибраних, бейджем кількості. Права панель: пошук + блок "Вибрані" зверху + пагінований список "Усі" (10/стор, "Ще N →"); empty-state. Props незмінні (initial/onApply/onClose)
- **FiltersTags** — chip-row з активними фільтрами + "Фільтри (N)" кнопка
- **DrillDownModal** — drill-down по кліку у breakdown-секції. Для `store`/`transaction-category`/`payment-method` з ненульовим id показує **згруповану розбивку** магазинів/категорій через `getByStore`/`getByTransactionCategory` (магазин → list кат. транзакцій; категорія/метод оплати → list магазинів) у вигляді рядків з progress bar + count + %. Для NULL-bucket id та `item-category` — табличний receipt/items view (fallback). Props незмінні (kind/item/filters/onClose)

---

## Hooks (`src/hooks/`)

- **useReceipts(filters?)** → `{ receipts, total, page, hasMore, isLoading, error, loadMore, createReceipt, updateReceipt, removeReceipt, refresh, reload }` (`useReceipts.ts`)
  `filters: ReceiptFilters = { storeName?, dateFrom?, dateTo?, transactionCategoryIds?, storeIds? }` — server-side; зміна filters скидає на page 1. PAGE_SIZE=5
- **useStores()** → `{ stores, isLoading, error, createStore, updateStore, removeStore }` (`useStores.ts`)
  `createStore` повертає `{ store?, error? }`; `removeStore` → `{ receiptsCount?, error? }`
- **usePaymentMethods()** → `{ methods, isLoading, error, createMethod, updateMethod, removeMethod }` (`usePaymentMethods.ts`)
- **useTransactionCategories()** → `{ categories, isLoading, error, createCategory, updateCategory }` (`useTransactionCategories.ts`)
- **useItemCategories()** → `{ categories, isLoading, error, createCategory, updateCategory, removeCategory, removeConfirmedCategory }` (`useItemCategories.ts`)
  `removeCategory` → `{ itemsCount?, error? }`
- **useRegister()**, **useLogin()**, **useForgotPassword()**, **useResetPassword()**, **useLogout()** — (`useAuth.ts`)
  `useLogin`: rate limiting (3 спроби → 30с блокування); поля: isLoading, error, attempts, isLocked, lockedUntil
- **useCountUp(target, duration)** → `number` (`useCountUp.ts`) — rAF ease-out ~700ms, для success анімацій

---

## API (`src/api/`)

### receipts.api.ts
- `receiptsApi.parse(files: File[])` → `Promise<ParsedReceiptDto>` — multipart `images[]`
- `receiptsApi.parseFromQrImage(file: File)` → `Promise<ParsedReceiptDto>` — multipart `image`
- `receiptsApi.getAll(params: ReceiptListParams = {})` → `Promise<ReceiptsListResponse>` — `{ page?, limit?, storeName?, dateFrom?, dateTo?, transactionCategoryIds?[], storeIds?[] }` (server-side filtering)
- `receiptsApi.getOne(id)` → `Promise<Receipt>`
- `receiptsApi.create(dto)` → `Promise<Receipt>`
- `receiptsApi.update(id, dto)` → `Promise<Receipt>`
- `receiptsApi.remove(id)` → `Promise<void>`

### statistics.api.ts
- `statisticsApi.getSummary(filters)`, `.getTimeline(filters)`
- `.getByTransactionCategory(filters)`, `.getByStore(filters)`, `.getByItemCategory(filters)`
- `.getReceiptsByTransactionCategory(categoryId, filters)` — drill-down
- `.getReceiptsByStore(storeId, filters)` — drill-down
- `.getItemsByItemCategory(itemCategoryId, filters)` — drill-down
- `NULL_BUCKET_ID = 'none'` — sentinel для NULL category

### Решта
- `storesApi.getAll/create/update/remove` (`stores.api.ts`)
- `paymentMethodsApi.getAll/create/update/remove` (`payment-methods.api.ts`)
- `transactionCategoriesApi.getAll/create/update` (`transaction-categories.api.ts`)
- `itemCategoriesApi.getAll/create/update/remove/removeConfirmed` (`item-categories.api.ts`)
- `authApi.register/login/logout/refresh/forgotPassword/resetPassword` (`auth.api.ts`)

---

## Types (`src/types/`)

- **receipt.types.ts** — `Receipt`, `ReceiptItem`, `ReceiptsListResponse`, `CreateReceiptDto` (+totalAmount?), `UpdateReceiptDto` (+totalAmount?), `ParsedReceiptDto` (+storeId/suggestedStoreName/storeIsNew), `ParsedItem` (+itemCategoryId/suggestedCategoryName/categoryIsNew/originalAmount/discountAmount/hasDiscount), `ParseMeta`, `PriceConflict`
- **statistics.types.ts** — `StatisticsFilters` (+paymentMethodId?: string[]), `SummaryResponse`, `BreakdownResponse`, `TimelineResponse`, `Granularity`
- **store.types.ts** — `Store`, `CreateStoreDto`, `UpdateStoreDto`, `DeleteStoreResponse`
- **payment-method.types.ts** — `PaymentMethod`, `CreatePaymentMethodDto`, `UpdatePaymentMethodDto`
- **transaction-category.types.ts** — `TransactionCategory`, `CreateTransactionCategoryDto`, `UpdateTransactionCategoryDto`
- **item-category.types.ts** — `ItemCategory`, `CreateItemCategoryDto`, `UpdateItemCategoryDto`, `RemoveItemCategoryResponse`
- **auth.types.ts** — `RegisterDto`, `LoginDto`, `ForgotPasswordDto`, `ResetPasswordDto`, `AuthResponse`
- **api.types.ts** — `ApiError` (extends Error, має status: number)

---

## Lib / Utils (`src/lib/`)

- **category-colors.ts** — `categoryColor(id: string) → { bg, text, solid }` — детермінована палітра 10 кольорів за UUID; `NO_CATEGORY_CHART_COLOR = '#94A3B8'`
- **client.ts** (`src/api/client.ts`) — `apiClient.get/post/patch/delete`; Bearer auth з in-memory token; 401 interceptor (silent refresh → redirect '/login'); `setAccessToken/getAccessToken`

---

## Design Tokens (`globals.css`)

- `--brand #0F6E56`, `--brand-strong`, `--brand-soft`, `--brand-gradient`
- `--focus-ring`, `--shadow-*`
- Утиліти: `.tnum` (tabular-nums), `.card-surface`, `.card-hover`
- Keyframes: `scanline`, `shimmer`, `pop-in`, `fade-swap`

---

## Env Variables

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

---

## Архітектурні рішення

- API виклики ТІЛЬКИ через `src/api/` шар, ніколи в компонентах
- Бізнес-логіка в `hooks/`, не в компонентах
- Access token — in-memory (module-level var в client.ts), втрачається при refresh сторінки
- Refresh token — httpOnly cookie (встановлює BE), через `credentials: 'include'`
- При 401 → silent refresh → retry; якщо провалився → `window.location.href = '/login'` (skip якщо вже на auth-сторінці)
- Next.js middleware перевіряє `refreshToken` cookie для protected routes
- Всі інтерактивні компоненти мають `'use client'`
- `useSearchParams()` завжди в Suspense boundary
- `categoryColor(id)` — для бейджів, donut, breakdown, аватарів магазинів (детермінована за UUID)
