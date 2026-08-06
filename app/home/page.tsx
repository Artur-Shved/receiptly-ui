'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Pencil, Receipt, Upload } from 'lucide-react';
import { TopNav } from '@/src/components/features/home/TopNav';
import { BottomTabBar } from '@/src/components/features/home/BottomTabBar';
import { Button } from '@/src/components/ui/Button';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { categoryColor } from '@/src/lib/category-colors';
import { ReceiptDetailsModal } from '@/src/components/features/receipts/ReceiptDetailsModal';
import { useLogout } from '@/src/hooks/useAuth';
import { authApi } from '@/src/api/auth.api';
import { receiptsApi } from '@/src/api/receipts.api';
import { statisticsApi } from '@/src/api/statistics.api';
import type { Receipt as ReceiptType } from '@/src/types/receipt.types';
import type { SummaryResponse } from '@/src/types/statistics.types';

function getGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Доброго ранку';
  if (hour >= 12 && hour < 18) return 'Доброго дня';
  return 'Доброго вечора';
}

const UK_MONTHS_LONG_NOM = [
  'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
  'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень',
];
const UK_MONTHS_LONG_GEN = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];
const UK_WEEKDAYS_LONG = [
  'неділя', 'понеділок', 'вівторок', 'середа',
  'четвер', 'пʼятниця', 'субота',
];

function getCurrentMonth(now: Date): string {
  return UK_MONTHS_LONG_NOM[now.getMonth()];
}

function formatDate(now: Date): string {
  return `${UK_WEEKDAYS_LONG[now.getDay()]}, ${now.getDate()} ${UK_MONTHS_LONG_GEN[now.getMonth()]} ${now.getFullYear()} р.`;
}

const UK_MONTHS_SHORT = [
  'січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
  'лип', 'серп', 'вер', 'жовт', 'лист', 'груд',
];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${UK_MONTHS_SHORT[d.getMonth()]}`;
}

function CategoryBadge({ category }: { category: { id: string; name: string } | null | undefined }) {
  if (!category) return <span className="text-[12px] text-[#9ca3af]">—</span>;
  const { bg, text } = categoryColor(category.id);
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {category.name}
    </span>
  );
}

const QUICK_ACTIONS = [
  {
    href: '/receipts/upload',
    label: 'Завантажити чек',
    Icon: Upload,
    iconBg: '#E1F5EE',
    iconColor: '#0F6E56',
  },
  {
    href: '/receipts/upload/manual',
    label: 'Ввести вручну',
    Icon: Pencil,
    iconBg: '#F0F0F3',
    iconColor: '#1a1a1a',
  },
] as const;

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div
        className="w-[400px] max-w-[calc(100%-32px)] rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-[18px] font-medium text-[#1a1a1a]">Вийти з акаунту?</h2>
        <p className="mb-6 text-[14px] text-gray-500">
          Вас буде перенаправлено на стартовий екран. Дані збережуться.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onCancel}>
            Скасувати
          </Button>
          <Button variant="danger" fullWidth={false} onClick={onConfirm}>
            Вийти
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useLogout();

  // Receipt opened in place on the home screen (no navigation to /receipts).
  const [detailsReceipt, setDetailsReceipt] = useState<ReceiptType | null>(null);
  const openReceipt = (id: string) => {
    // Fetch the full receipt so the details modal has its items.
    receiptsApi.getOne(id).then(setDetailsReceipt).catch(() => {});
  };

  const [userName, setUserName] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [receiptsError, setReceiptsError] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    authApi.me().then((u) => setUserName(u.name)).catch(() => {});
  }, []);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateFrom = `${y}-${pad(m + 1)}-01`;
    const dateTo = `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`;

    setReceiptsLoading(true);
    receiptsApi
      .getAll({ page: 1, limit: 20, dateFrom, dateTo })
      .then((res) => {
        setReceipts(res.data);
        setReceiptsLoading(false);
      })
      .catch(() => { setReceiptsError(true); setReceiptsLoading(false); });

    statisticsApi
      .getSummary({ dateFrom, dateTo })
      .then(setSummary)
      .catch(() => {});
  }, []);

  const monthlyStats = useMemo(
    () => ({
      total: summary?.totalAmount ?? 0,
      count: summary?.receiptsCount ?? 0,
    }),
    [summary],
  );

  const recentReceipts = receipts.slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="flex-1 bg-[#F7F7F7] pb-20 md:pb-0">
        <div className="mx-auto w-full max-w-[1024px] px-6 py-8">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-[22px] font-medium text-[#1a1a1a]">
            {now ? getGreeting(now) : ' '}{userName ? `, ${userName}` : ''}
          </h1>
          <p className="mt-1 text-[14px] text-gray-500">{now ? formatDate(now) : ' '}</p>
        </div>

        {/* Hero card — spent this month (web-design-refresh §5) */}
        {summary === null ? (
          <Skeleton className="h-[120px] w-full" style={{ borderRadius: 16 }} />
        ) : (
          <div
            className="flex flex-wrap items-end justify-between gap-4"
            style={{
              // Solid brand fallback under the gradient so white text stays
              // readable even if the CSS variable hasn't loaded (stale dev CSS).
              backgroundColor: '#0F6E56',
              backgroundImage: 'var(--brand-gradient)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Витрачено у {now ? getCurrentMonth(now) : ' '}
              </p>
              <p className="tnum mt-1 text-[32px] font-semibold leading-tight text-white">
                {Math.trunc(monthlyStats.total)}
                <span className="text-[20px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  .{monthlyStats.total.toFixed(2).split('.')[1]} ₴
                </span>
              </p>
            </div>
            <p className="tnum text-[12px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {monthlyStats.count} чеків · середній{' '}
              {(summary?.avgAmount ?? 0).toFixed(2)} ₴
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div className="mb-8 mt-4 grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ href, label, Icon, iconBg, iconColor }) => (
            <Link
              key={href}
              href={href}
              className="card-surface card-hover flex flex-col items-center gap-2.5 px-4 py-5"
              style={{ borderRadius: 14 }}
            >
              <div
                className="flex h-[40px] w-[40px] items-center justify-center"
                style={{ backgroundColor: iconBg, borderRadius: 10 }}
              >
                <Icon size={20} color={iconColor} />
              </div>
              <span className="text-[13px] font-medium text-[#1a1a1a]">{label}</span>
            </Link>
          ))}
        </div>

        {/* Recent receipts header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Останні чеки</h2>
          <Link href="/receipts" className="text-[13px] text-gray-500 hover:underline">
            Переглянути всі
          </Link>
        </div>

        {receiptsError && (
          <div className="rounded-xl border border-[#e5e7eb] py-8 text-center text-[13px] text-gray-500">
            Не вдалось завантажити дані
          </div>
        )}

        {!receiptsError && receiptsLoading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-[48px] w-full" />
            <Skeleton className="h-[48px] w-full" />
            <Skeleton className="h-[48px] w-full" />
          </div>
        )}

        {!receiptsError && !receiptsLoading && recentReceipts.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-[#e5e7eb] py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F7F7]">
              <Receipt size={32} color="#9ca3af" />
            </div>
            <h3 className="mb-2 text-[16px] font-medium text-[#1a1a1a]">Поки немає чеків</h3>
            <p className="mb-6 max-w-xs text-center text-[14px] text-gray-500">
              Додайте перший чек, щоб почати відстежувати витрати
            </p>
            <Link href="/receipts/upload">
              <Button fullWidth={false} icon={<Camera size={16} />}>
                Додати перший чек
              </Button>
            </Link>
          </div>
        )}

        {!receiptsError && !receiptsLoading && recentReceipts.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
            {/* Table header — desktop only; mobile renders stacked cards instead */}
            <div
              className="hidden text-[11px] uppercase tracking-wide text-[#0F6E56] md:grid"
              style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', backgroundColor: 'var(--brand-soft, #E1F5EE)', padding: '10px 16px' }}
            >
              <span>Магазин</span>
              <span>Категорія</span>
              <span>Дата</span>
              <span>Метод оплати</span>
              <span className="text-right">Сума</span>
            </div>

            {recentReceipts.map((receipt) => {
              const storeName = receipt.store?.name ?? '—';
              const storeTint = categoryColor(receipt.store?.id);
              return (
                <div
                  key={receipt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openReceipt(receipt.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openReceipt(receipt.id); }}
                  className="flex cursor-pointer flex-col gap-1.5 border-t border-[#e5e7eb] px-4 py-3 hover:bg-[#FAFAFA] md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] md:items-center md:gap-0"
                >
                  <div className="flex items-center justify-between gap-2 md:contents">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-full text-[12px] font-medium"
                        style={{ backgroundColor: storeTint.bg, color: storeTint.text }}
                      >
                        {storeName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[14px] font-medium text-[#1a1a1a]">{storeName}</span>
                    </div>
                    <span className="tnum order-5 text-right text-[15px] font-semibold text-[#1a1a1a]">
                      {receipt.totalAmount} {receipt.currency}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:contents">
                    <div>
                      <CategoryBadge category={receipt.transactionCategory} />
                    </div>
                    <span className="text-[13px] text-[#6b7280]">{formatShortDate(receipt.receiptDate)}</span>
                    <span className="text-[13px] text-[#6b7280]">{receipt.paymentMethod?.name ?? '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </main>

      <BottomTabBar />

      {detailsReceipt && (
        <ReceiptDetailsModal
          receipt={detailsReceipt}
          onClose={() => setDetailsReceipt(null)}
          onEdit={() => router.push(`/receipts?receiptId=${detailsReceipt.id}`)}
          onDelete={() => router.push(`/receipts?receiptId=${detailsReceipt.id}`)}
        />
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => {
            setShowLogoutModal(false);
            logout();
          }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}
