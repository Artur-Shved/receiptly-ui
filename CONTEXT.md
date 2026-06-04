# receiptly-ui/CONTEXT.md — FE Контекст

> Власник: FE Agent. Оновлюється після кожної імплементованої задачі.
> Tech Lead читає цей файл перед декомпозицією задач.

---

## Оновлено: 2026-06-04 — Авто-категоризація товарів при парсингу

### Зміни
- Types (`types/receipt.types.ts`): `ParsedItem` +`itemCategoryId: string|null`, `suggestedCategoryName: string|null`, `categoryIsNew: boolean` (legacy `category` ігнорується клієнтом); `CreateReceiptItemDto` +`suggestedCategoryName?: string|null`.
- `app/receipts/upload/page.tsx` + `app/receipts/upload/qr/page.tsx`: при мапінгу parsed→items тепер `itemCategoryId: pi.itemCategoryId ?? null` (раніше завжди null) + зберігається `suggestedCategoryName`. На confirm кожен item: `suggestedCategoryName = itemCategoryId ? null : (suggestedCategoryName ?? null)` — існуюча категорія йде як id, нова пропозиція прокидається для створення на BE.
- ItemSubModal: локальний стан `suggestedCategoryName` (seed з item, лише коли немає itemCategoryId); `handleCategoryChange` очищає suggestion при виборі існуючої категорії, відновлює при очищенні. Бейдж «нова: {name}» біля label «Категорія» + placeholder «Буде створено «{name}»» + хелпер-текст. Рядки товарів показують зелений бейдж «нова: {name}». Без еагерного створення — BE створює на confirm; inline-create через `createItemCategory` лишається для ручного.

---

## Оновлено: 2026-05-31 — Item discounts

### Зміни
- `ReceiptItem` + `CreateReceiptItemDto` + `ParsedItem` отримали `originalAmount` + `discountAmount` (а `ParsedItem` ще й `hasDiscount`). `totalPrice` залишається у `ReceiptItem` / `ParsedItem` (computed by BE), але **прибрано з input** `CreateReceiptItemDto` — клієнт ніколи його не надсилає.
- `ItemSubModal` (всі 4 копії: `/receipts` EditModal, `/receipts/upload`, `/receipts/upload/manual`, `/receipts/upload/qr`):
  - "Сума товару" перейменовано на "Сума без знижки" (зберігає auto-fill з qty × price)
  - Додано окреме поле "Знижка ₴ (необов'язково)"
  - Внизу — read-only картка "Фінальна сума" з live-перерахунком
  - Warn якщо `discount > original` — "фінальна сума буде 0"
- Items table (DetailsModal, ItemsEditor у LLM, manual table, QR preview, /receipts EditModal) — якщо `discountAmount > 0`: оригінал перекреслений, фінальна сума жирним; інакше тільки фінальна сума
- Обчислення `computedTotal` для warning банера "сума товарів ≠ оригінал чеку" базується на `max(0, original − discount)`

---

## Оновлено: 2026-05-30 — QR (ДПС) Flow E

### Нова сторінка `/receipts/upload/qr`
- State machine: `upload` → `confirm` → `processing` → `preview` → `success`, з error overlay для будь-якого кроку
- **Upload**: drag&drop + 2 кнопки (Сфотографувати / З галереї); валідація формат+розмір
- **Confirm**: preview QR-фото з кнопками "Перефотографувати" / "Використати"
- **Processing**: компонент `ProcessingStages` — 3 послідовні етапи (Декодування QR / Запит до ДПС / Розпізнавання) з status icons (wait/active/done/error); прогрес симульований таймером 2.2s/stage поки BE одним викликом виконує pipeline
- **Preview**: 2×2 meta grid (Магазин + Дата з DPS badge; Метод оплати + Категорія транзакції required з червоним підсвічуванням якщо порожні); items table з inline ItemSubModal; total + sum-mismatch warning; auto-select існуючого магазину якщо ДПС повернула існуючу назву
- **Error**: маппінг 7 кодів (`QR_NOT_FOUND`, `QR_INVALID_PARAMS`, `QR_NOT_FISCAL`, `DPS_UNAVAILABLE`, `DPS_NOT_FOUND`, `DPS_PARSE_FAILED`, `NETWORK_ERROR`, `GENERIC`) на текст + опції "Спробувати ще раз / Фото чеку / Вручну / Скасувати"

### Оновлений `AddReceiptChoiceModal`
- Тепер 3 картки замість 2: Сфотографувати (LLM, #1a1a1a акцент) / Сканувати QR-код (новий, #185FA5 акцент) / Ввести вручну (нейтрал)
- Info banner внизу: "QR-код знаходиться внизу фіскального чеку..."

### Новий API method
- `receiptsApi.parseFromQrImage(file: File)` — FormData з `image` → `POST /api/receipts/parse-from-qr-image`

### DpsBadge helper
- Маленький badge `ДПС` (background `#E6F1FB`, color `#0C447C`) поряд з label полів які заповнені з реєстру

---

## Оновлено: 2026-05-30 — Statistics Phase 2 (filters + donut + breakdowns + drill-downs)

### Нові компоненти `src/components/features/statistics/`
- **FiltersModal** — мультивибір (Магазин / Категорія транзакції / Категорія товару) з чекбоксами; Скинути / Скасувати / Застосувати(N)
- **FiltersTags + FilterButton** — chip-row з активними фільтрами біля кнопки "Фільтри (N)"; видалення окремого фільтра або всіх
- **DonutChart** (Recharts PieChart + Cell + Tooltip + ResponsiveContainer) — by-transaction-category з центральним total; легенда справа; click → drill-down
- **BreakdownSection** — переюзана секція для 3 розбивок (категорії / магазини / товари); top-5 з progress bar + percentage
- **DrillDownModal** — 3 типи (transaction-category / store / item-category); таблиця з різними колонками залежно від kind; "Показано N з total"

### Залежність
- Додано `recharts ^3.8.1`

### Оновлений `app/statistics/page.tsx`
- Підвантажує 5 endpoints паралельно (summary, timeline, by-tx-cat, by-store, by-item-cat)
- Filter modal + active tags row
- Donut + Timeline у 1fr/1.6fr grid
- 3 BreakdownSection у grid-cols-3
- Drill-down state — клік на сегмент donut або рядок breakdown → DrillDownModal
- Empty state branching: "немає даних" vs "немає для фільтрів" (з кнопкою reset)

### Новий API methods (`statisticsApi`)
- `getReceiptsByTransactionCategory(categoryId, filters)`
- `getReceiptsByStore(storeId, filters)`
- `getItemsByItemCategory(itemCategoryId, filters)`
- `NULL_BUCKET_ID = 'none'` — sentinel для NULL category

---

## Оновлено: 2026-05-30 — Statistics Phase 1 (мінімальний FE)

### Новий route: `/statistics`
- `app/statistics/page.tsx` — головна сторінка статистики; defaults на поточний місяць
- Дані: 2 паралельні запити `getSummary` + `getTimeline`; empty state коли receipts_count = 0
- Error state: banner з "Оновити" кнопкою

### Нові компоненти `src/components/features/statistics/`
- **PeriodTabs** — 4 вкладки (Тиждень/Місяць/Рік/Свій); "Свій" → popover з двома `<input type="date">`; експортує helper `presetRange(period)`
- **StatsGrid** — 3 cards (Витрати, Кількість чеків, Середній чек); trend ±% vs `summary.previous` через `pctChange`; up = red для витрат, gray для кількості; skeleton під час завантаження
- **TimelineChart** — простий SVG bar chart (без recharts на Phase 1); auto-format X-axis labels залежно від granularity; hover tooltip з сумою + кількістю чеків

### Нові types
- `src/types/statistics.types.ts` — `StatisticsFilters`, `SummaryResponse`, `BreakdownResponse`, `TimelineResponse`, `Granularity`

### Нові API
- `src/api/statistics.api.ts` — `statisticsApi.getSummary/getByTransactionCategory/getByStore/getByItemCategory/getTimeline`; query string build з `URLSearchParams` (масиви → `?storeId[]=a&storeId[]=b`)

### Оновлені файли
- `middleware.ts` — додано `/statistics` у `PROTECTED_ROUTES` + matcher
- `src/components/features/home/TopNav.tsx` — link "Статистика" тепер `href="/statistics"` з active state

### Phase 2 (відкладено)
- Filter modal + active tags
- Donut chart (recharts)
- 3 breakdown sections (by-tx-cat / by-store / by-item-cat) + drill-down modals

---

## Оновлено: 2026-05-30 — Multi-photo Receipt Upload (Flow D)

### Зміни
- `receiptsApi.parse(files: File[])` — FormData з кількома `images` полями (single-photo тепер просто масив з 1 елемента)
- Types: `ParsedItem.photoIndex?`, новий `ParseMeta` (photosTotal, photosSucceeded, photosFailed, duplicatesRemoved, hasPriceConflicts, failedIndices, priceConflicts), новий `PriceConflict`
- `/receipts/upload` Step 1 переписано: список фото з add/remove (max 10) + drag&drop, авто-парс при кліку "Далі →"
- Step 2: per-photo progress card (waiting/processing/done/error) + progress bar + meta форма праворуч
- Step 3 warning banners:
  - Info: дублікати видалено (без price conflicts) — синій banner
  - Warning: price conflicts — жовтий banner + conflict detail cards (saved vs removed з photoIndex)
  - Error: partial failure — червоний banner з номерами фото що не розпізнались
  - Full error state: всі фото failed → екран з options ("Спробувати ще раз" / "Ввести вручну" → /receipts/upload/manual / "Скасувати")
- Conflict badge "з фото [N]" поруч з назвою товару в items table коли є price conflict

---

## Оновлено: 2026-05-30 — Manual Receipt Entry (Flow C)

### Зміни
- Новий компонент **AddReceiptChoiceModal** (`src/components/features/receipts/AddReceiptChoiceModal.tsx`) — modal з двома картками "Сфотографувати чек" / "Ввести вручну". Відкривається при натисканні "Додати чек" в TopNav або з empty state `/receipts`.
- Нова сторінка `/receipts/upload/manual` — повний manual flow:
  - Step 1: Магазин (SearchableStoreSelect) + Метод оплати + Категорія транзакції (всі опціональні)
  - Step 2: Дата покупки + список товарів (empty state + items table) + sub-modal додавання/редагування товару + manual total override з sum-mismatch warning
  - Step 3: Success екран (з summary chips)
  - Cancel-with-data confirmation, sum-mismatch confirm modal
- `TopNav` — кнопка "Додати чек" тепер відкриває AddReceiptChoiceModal замість прямого переходу.
- `/receipts` empty state — кнопка "Додати чек" відкриває AddReceiptChoiceModal.
- BE без змін — той самий `POST /receipts` для обох flows.

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
