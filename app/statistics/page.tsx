'use client';

import { useEffect, useMemo, useState } from 'react';
import { WifiOff, Receipt, Camera } from 'lucide-react';
import Link from 'next/link';
import { TopNav } from '@/src/components/features/home/TopNav';
import { Button } from '@/src/components/ui/Button';
import { useLogout } from '@/src/hooks/useAuth';
import { useStores } from '@/src/hooks/useStores';
import { useTransactionCategories } from '@/src/hooks/useTransactionCategories';
import { useItemCategories } from '@/src/hooks/useItemCategories';
import { PeriodTabs, presetRange, type PeriodKey } from '@/src/components/features/statistics/PeriodTabs';
import { StatsGrid } from '@/src/components/features/statistics/StatsGrid';
import { TimelineChart } from '@/src/components/features/statistics/TimelineChart';
import { DonutChart } from '@/src/components/features/statistics/DonutChart';
import { BreakdownSection } from '@/src/components/features/statistics/BreakdownSection';
import { BreakdownAllCard } from '@/src/components/features/statistics/BreakdownAllCard';
import { FiltersModal } from '@/src/components/features/statistics/FiltersModal';
import { FiltersTags, FilterButton } from '@/src/components/features/statistics/FiltersTags';
import { DrillDownModal, type DrillKind } from '@/src/components/features/statistics/DrillDownModal';
import { statisticsApi } from '@/src/api/statistics.api';
import type {
  StatisticsFilters,
  SummaryResponse,
  TimelineResponse,
  BreakdownResponse,
  BreakdownItem,
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

interface ActiveFilters {
  storeId: string[];
  transactionCategoryId: string[];
  itemCategoryId: string[];
}

const EMPTY_FILTERS: ActiveFilters = {
  storeId: [],
  transactionCategoryId: [],
  itemCategoryId: [],
};

export default function StatisticsPage() {
  const { logout } = useLogout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { stores } = useStores();
  const { categories: txCategories } = useTransactionCategories();
  const { categories: itemCategories } = useItemCategories();

  // Period state
  const [period, setPeriod] = useState<PeriodKey>('month');
  const initialRange = presetRange('month');
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom);
  const [dateTo, setDateTo] = useState(initialRange.dateTo);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Data state
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [byTxCat, setByTxCat] = useState<BreakdownResponse | null>(null);
  const [byStore, setByStore] = useState<BreakdownResponse | null>(null);
  const [byPaymentMethod, setByPaymentMethod] = useState<BreakdownResponse | null>(null);
  const [byItemCat, setByItemCat] = useState<BreakdownResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drill-down state
  const [drillDown, setDrillDown] = useState<{ kind: DrillKind; item: BreakdownItem } | null>(null);

  // "Show all" view-mode — replaces the 3-column grid with a single full-width
  // card listing every item of the chosen breakdown.
  const [allView, setAllView] = useState<DrillKind | null>(null);

  const filters: StatisticsFilters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      storeId: activeFilters.storeId.length ? activeFilters.storeId : undefined,
      transactionCategoryId: activeFilters.transactionCategoryId.length
        ? activeFilters.transactionCategoryId
        : undefined,
      itemCategoryId: activeFilters.itemCategoryId.length
        ? activeFilters.itemCategoryId
        : undefined,
    }),
    [dateFrom, dateTo, activeFilters],
  );

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // allSettled so a single endpoint failure (e.g. BE not yet restarted with
    // the new /by-payment-method route) doesn't blank out the whole page.
    Promise.allSettled([
      statisticsApi.getSummary(filters),
      statisticsApi.getTimeline(filters),
      statisticsApi.getByTransactionCategory(filters),
      statisticsApi.getByStore(filters),
      statisticsApi.getByPaymentMethod(filters),
      statisticsApi.getByItemCategory(filters),
    ])
      .then(([s, t, bt, bs, bp, bi]) => {
        if (s.status === 'fulfilled') setSummary(s.value);
        if (t.status === 'fulfilled') setTimeline(t.value);
        if (bt.status === 'fulfilled') setByTxCat(bt.value);
        if (bs.status === 'fulfilled') setByStore(bs.value);
        if (bp.status === 'fulfilled') setByPaymentMethod(bp.value);
        if (bi.status === 'fulfilled') setByItemCat(bi.value);
        // Surface an error only if summary (the critical first call) failed —
        // partial-section errors render as in-card empty states.
        if (s.status === 'rejected') {
          const reason = s.reason;
          setError(reason instanceof ApiError ? reason.message : 'Помилка завантаження');
        }
      })
      .finally(() => setIsLoading(false));
  }, [filters]);

  const handlePeriodChange = (next: PeriodKey, from: string, to: string) => {
    setPeriod(next);
    setDateFrom(from);
    setDateTo(to);
  };

  const totalFilterCount =
    activeFilters.storeId.length +
    activeFilters.transactionCategoryId.length +
    activeFilters.itemCategoryId.length;

  const handleRemoveTag = (kind: keyof ActiveFilters, id: string) => {
    setActiveFilters((prev) => ({ ...prev, [kind]: prev[kind].filter((x) => x !== id) }));
  };

  // Show the onboarding empty state ONLY when the user has no receipts AND no
  // filters are active. With active filters we keep the regular layout (with
  // zeros / per-card empty placeholders) so the user can adjust the filters
  // and see things update in place.
  const showOnboardingEmpty =
    !isLoading &&
    !error &&
    summary !== null &&
    summary.receiptsCount === 0 &&
    totalFilterCount === 0;

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
            <div className="flex items-center gap-2">
              <PeriodTabs
                period={period}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChange={handlePeriodChange}
              />
              <FilterButton count={totalFilterCount} onClick={() => setShowFiltersModal(true)} />
            </div>
          </div>

          {/* Active filter tags */}
          {totalFilterCount > 0 && (
            <div className="mt-3">
              <FiltersTags
                filters={activeFilters}
                stores={stores}
                txCategories={txCategories}
                itemCategories={itemCategories}
                onRemove={handleRemoveTag}
                onResetAll={() => setActiveFilters(EMPTY_FILTERS)}
              />
            </div>
          )}

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

          {!error && showOnboardingEmpty && (
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

          {!error && !showOnboardingEmpty && (
            <>
              <div className="mt-5">
                <StatsGrid summary={summary} isLoading={isLoading} />
              </div>

              <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: '1fr 1.6fr' }}>
                <DonutChart
                  data={byTxCat?.items ?? null}
                  totalAmount={byTxCat?.totalAmount ?? 0}
                  isLoading={isLoading}
                  onSegmentClick={(item) => setDrillDown({ kind: 'transaction-category', item })}
                />
                <TimelineChart data={timeline} isLoading={isLoading} />
              </div>

              <div className="mt-4">
                {allView === 'transaction-category' && (
                  <BreakdownAllCard
                    title="По категоріях — всі"
                    items={byTxCat?.items ?? []}
                    countSuffix={(n) => `${n} чеків`}
                    onItemClick={(item) => setDrillDown({ kind: 'transaction-category', item })}
                    onBack={() => setAllView(null)}
                  />
                )}
                {allView === 'store' && (
                  <BreakdownAllCard
                    title="По магазинах — всі"
                    items={byStore?.items ?? []}
                    countSuffix={(n) => `${n} чеків`}
                    onItemClick={(item) => setDrillDown({ kind: 'store', item })}
                    onBack={() => setAllView(null)}
                  />
                )}
                {allView === 'payment-method' && (
                  <BreakdownAllCard
                    title="По методах оплати — всі"
                    items={byPaymentMethod?.items ?? []}
                    countSuffix={(n) => `${n} чеків`}
                    onItemClick={(item) => setDrillDown({ kind: 'payment-method', item })}
                    onBack={() => setAllView(null)}
                  />
                )}
                {allView === 'item-category' && (
                  <BreakdownAllCard
                    title="По товарах — всі"
                    items={byItemCat?.items ?? []}
                    countSuffix={(n) => `${n} од.`}
                    onItemClick={(item) => setDrillDown({ kind: 'item-category', item })}
                    onBack={() => setAllView(null)}
                  />
                )}
                {allView === null && (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <BreakdownSection
                      title="По категоріях"
                      items={byTxCat?.items ?? null}
                      isLoading={isLoading}
                      countSuffix={(n) => `${n} чеків`}
                      onItemClick={(item) => setDrillDown({ kind: 'transaction-category', item })}
                      onShowAll={() => setAllView('transaction-category')}
                    />
                    <BreakdownSection
                      title="По магазинах"
                      items={byStore?.items ?? null}
                      isLoading={isLoading}
                      countSuffix={(n) => `${n} чеків`}
                      onItemClick={(item) => setDrillDown({ kind: 'store', item })}
                      onShowAll={() => setAllView('store')}
                    />
                    <BreakdownSection
                      title="По методах оплати"
                      items={byPaymentMethod?.items ?? null}
                      isLoading={isLoading}
                      countSuffix={(n) => `${n} чеків`}
                      onItemClick={(item) => setDrillDown({ kind: 'payment-method', item })}
                      onShowAll={() => setAllView('payment-method')}
                    />
                    <BreakdownSection
                      title="По товарах"
                      items={byItemCat?.items ?? null}
                      isLoading={isLoading}
                      countSuffix={(n) => `${n} од.`}
                      onItemClick={(item) => setDrillDown({ kind: 'item-category', item })}
                      onShowAll={() => setAllView('item-category')}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showFiltersModal && (
        <FiltersModal
          initial={activeFilters}
          onApply={(next) => {
            setActiveFilters(next);
            setShowFiltersModal(false);
          }}
          onClose={() => setShowFiltersModal(false)}
        />
      )}

      {drillDown && (
        <DrillDownModal
          kind={drillDown.kind}
          item={drillDown.item}
          filters={filters}
          onClose={() => setDrillDown(null)}
        />
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}
