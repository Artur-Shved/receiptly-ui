'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Camera, Receipt } from 'lucide-react';
import { TopNav } from '@/src/components/features/home/TopNav';
import { Button } from '@/src/components/ui/Button';
import { useLogout } from '@/src/hooks/useAuth';
import { authApi } from '@/src/api/auth.api';
import { receiptsApi } from '@/src/api/receipts.api';
import type { Receipt as ReceiptType } from '@/src/types/receipt.types';

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

const CATEGORY_COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#FFEDD5', text: '#C2410C' },
];
function categoryColor(name: string) {
  return CATEGORY_COLORS[name.charCodeAt(0) % CATEGORY_COLORS.length];
}

const STORE_COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444'];
function storeColor(name: string): string {
  return STORE_COLORS[name.charCodeAt(0) % STORE_COLORS.length];
}

function CategoryBadge({ name }: { name: string | null | undefined }) {
  if (!name) return <span className="text-[12px] text-[#9ca3af]">—</span>;
  const { bg, text } = categoryColor(name);
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {name}
    </span>
  );
}

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div
        className="w-[400px] rounded-xl bg-white p-6 shadow-xl"
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useLogout();

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

  useEffect(() => {
    setReceiptsLoading(true);
    receiptsApi
      .getAll(1, 20)
      .then((res) => { setReceipts(res.data); setReceiptsLoading(false); })
      .catch(() => { setReceiptsError(true); setReceiptsLoading(false); });
  }, []);

  const currentYearMonth = (now ?? new Date(0)).toISOString().slice(0, 7);

  const monthlyStats = useMemo(() => {
    const monthReceipts = receipts.filter((r) => r.receiptDate.startsWith(currentYearMonth));
    return {
      total: monthReceipts.reduce((sum, r) => sum + r.totalAmount, 0),
      count: monthReceipts.length,
    };
  }, [receipts, currentYearMonth]);

  const recentReceipts = receipts.slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="flex-1 bg-[#F7F7F7]">
        <div className="mx-auto w-full max-w-[1024px] px-6 py-8">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-[22px] font-medium text-[#1a1a1a]">
            {now ? getGreeting(now) : ' '}{userName ? `, ${userName}` : ''}
          </h1>
          <p className="mt-1 text-[14px] text-gray-500">{now ? formatDate(now) : ' '}</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#e5e7eb] p-5">
            <p className="text-[12px] uppercase tracking-wide text-gray-400">
              Витрати у {now ? getCurrentMonth(now) : ' '}
            </p>
            <p className="mt-2 text-[28px] font-medium">{monthlyStats.total.toFixed(2)} ₴</p>
            <p className="mt-1 text-[13px] text-gray-500">за поточний місяць</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] p-5">
            <p className="text-[12px] uppercase tracking-wide text-gray-400">
              Кількість чеків
            </p>
            <p className="mt-2 text-[28px] font-medium">{monthlyStats.count}</p>
            <p className="mt-1 text-[13px] text-gray-500">за поточний місяць</p>
          </div>
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
          <div className="flex justify-center py-12 text-[13px] text-gray-500">
            Завантаження...
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
            {/* Table header */}
            <div
              className="grid text-[11px] uppercase tracking-wide text-[#9ca3af]"
              style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', backgroundColor: '#F7F7F7', padding: '10px 16px' }}
            >
              <span>Магазин</span>
              <span>Категорія</span>
              <span>Дата</span>
              <span>Метод оплати</span>
              <span className="text-right">Сума</span>
            </div>

            {recentReceipts.map((receipt) => {
              const storeName = receipt.store?.name ?? '—';
              const color = storeColor(storeName);
              return (
                <Link
                  key={receipt.id}
                  href="/receipts"
                  className="grid cursor-pointer items-center border-t border-[#e5e7eb] px-4 py-3 hover:bg-[#FAFAFA]"
                  style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-full text-[12px] font-medium text-white"
                      style={{ backgroundColor: color }}
                    >
                      {storeName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[14px] font-medium text-[#1a1a1a]">{storeName}</span>
                  </div>
                  <div>
                    <CategoryBadge name={receipt.transactionCategory?.name} />
                  </div>
                  <span className="text-[13px] text-[#6b7280]">{formatShortDate(receipt.receiptDate)}</span>
                  <span className="text-[13px] text-[#6b7280]">{receipt.paymentMethod?.name ?? '—'}</span>
                  <span className="text-right text-[14px] font-medium text-[#1a1a1a]">
                    {receipt.totalAmount} {receipt.currency}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
        </div>
      </main>

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
