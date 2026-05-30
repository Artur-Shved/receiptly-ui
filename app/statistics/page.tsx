'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Receipt, Camera } from 'lucide-react';
import Link from 'next/link';
import { TopNav } from '@/src/components/features/home/TopNav';
import { Button } from '@/src/components/ui/Button';
import { useLogout } from '@/src/hooks/useAuth';
import { PeriodTabs, presetRange, type PeriodKey } from '@/src/components/features/statistics/PeriodTabs';
import { StatsGrid } from '@/src/components/features/statistics/StatsGrid';
import { TimelineChart } from '@/src/components/features/statistics/TimelineChart';
import { statisticsApi } from '@/src/api/statistics.api';
import type {
  StatisticsFilters,
  SummaryResponse,
  TimelineResponse,
} from '@/src/types/statistics.types';
import { ApiError } from '@/src/types/api.types';

// ─── Logout Modal ─────────────────────────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-[18px] font-medium">Вийти з акаунту?</h2>
        <p className="mb-6 text-[14px] text-gray-500">
          Вас буде перенаправлено на стартовий екран. Дані збережуться.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" fullWidth={false} onClick={onCancel}>Скасувати</Button>
          <Button variant="danger" fullWidth={false} onClick={onConfirm}>Вийти</Button>
        </div>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const { logout } = useLogout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Default: current month
  const [period, setPeriod] = useState<PeriodKey>('month');
  const initialRange = presetRange('month');
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom);
  const [dateTo, setDateTo] = useState(initialRange.dateTo);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const filters: StatisticsFilters = { dateFrom, dateTo };
    setIsLoading(true);
    setError(null);
    Promise.all([
      statisticsApi.getSummary(filters),
      statisticsApi.getTimeline(filters),
    ])
      .then(([s, t]) => {
        setSummary(s);
        setTimeline(t);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Помилка завантаження');
      })
      .finally(() => setIsLoading(false));
  }, [dateFrom, dateTo]);

  const handlePeriodChange = (next: PeriodKey, from: string, to: string) => {
    setPeriod(next);
    setDateFrom(from);
    setDateTo(to);
  };

  const isEmpty = !isLoading && !error && summary !== null && summary.receiptsCount === 0;

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onLogoutClick={() => setShowLogoutModal(true)} />

      <main className="flex-1 bg-[#F7F7F7]">
        <div className="mx-auto w-full" style={{ maxWidth: 1024, padding: 24 }}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[18px] font-medium text-[#1a1a1a]">Статистика</h1>
              <p className="mt-0.5 text-[13px] text-gray-500">
                Аналіз витрат за обраний період
              </p>
            </div>
            <PeriodTabs
              period={period}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChange={handlePeriodChange}
            />
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-[#FCEBEB] px-3 py-[10px] text-[#A32D2D]">
              <WifiOff size={16} className="flex-shrink-0" />
              <span className="text-[13px]">
                Не вдалось завантажити статистику. Перевірте підключення.{' '}
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => window.location.reload()}
                >
                  Оновити
                </button>
              </span>
            </div>
          )}

          {!error && isEmpty && (
            <div
              className="mt-6 flex flex-col items-center rounded-xl bg-white py-12"
              style={{ border: '0.5px solid #e5e7eb' }}
            >
              <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#F7F7F7] text-[#9ca3af]">
                <Receipt size={22} />
              </div>
              <p className="mb-2 text-[15px] font-medium text-[#1a1a1a]">
                Немає даних за цей період
              </p>
              <p className="mb-5 max-w-xs text-center text-[13px] text-gray-500">
                Додайте чеки щоб побачити аналітику витрат
              </p>
              <Link href="/receipts/upload">
                <Button fullWidth={false} icon={<Camera size={14} />}>
                  Додати чек
                </Button>
              </Link>
            </div>
          )}

          {!error && !isEmpty && (
            <>
              <div className="mt-5">
                <StatsGrid summary={summary} isLoading={isLoading} />
              </div>
              <div className="mt-4">
                <TimelineChart data={timeline} isLoading={isLoading} />
              </div>
            </>
          )}
        </div>
      </main>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}
