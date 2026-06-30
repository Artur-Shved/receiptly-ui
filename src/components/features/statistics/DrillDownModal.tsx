'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { statisticsApi } from '@/src/api/statistics.api';
import { chartColorScale } from '@/src/lib/category-colors';
import { ApiError } from '@/src/types/api.types';
import type {
  BreakdownItem,
  ReceiptDrillDownItem,
  ItemDrillDownItem,
  StatisticsFilters,
} from '@/src/types/statistics.types';

export type DrillKind = 'transaction-category' | 'store' | 'item-category' | 'payment-method';

interface Props {
  kind: DrillKind;
  item: BreakdownItem;
  filters: StatisticsFilters;
  onClose: () => void;
}

const UK_MONTHS_SHORT = [
  'січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
  'лип', 'серп', 'вер', 'жовт', 'лист', 'груд',
];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${UK_MONTHS_SHORT[d.getUTCMonth()]}`;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('uk-UA', { maximumFractionDigits: 2 });
}

function buildViewAllHref(kind: DrillKind, id: string, filters: StatisticsFilters): string {
  const params = new URLSearchParams();
  if (kind === 'store') params.set('storeId', id);
  else params.set('transactionCategoryId', id);
  params.set('dateFrom', filters.dateFrom);
  params.set('dateTo', filters.dateTo);
  return `/receipts?${params.toString()}`;
}

const HEADERS: Record<DrillKind, { suffix: string; cols: string[] }> = {
  'transaction-category': { suffix: 'чеків', cols: ['Магазин', 'Дата', 'Сума'] },
  store: { suffix: 'чеків', cols: ['Дата', 'Категорія', 'Сума'] },
  'item-category': { suffix: 'товарів', cols: ['Назва', 'Магазин', 'К-сть', 'Сума'] },
  'payment-method': { suffix: 'чеків', cols: ['Магазин', 'Дата', 'Сума'] },
};

type LoadedReceipts = { mode: 'receipts'; items: ReceiptDrillDownItem[]; total: number };
type LoadedItems = { mode: 'items'; items: ItemDrillDownItem[]; total: number };
type LoadedBreakdown = { mode: 'breakdown'; items: BreakdownItem[]; totalAmount: number };
type Loaded = LoadedReceipts | LoadedItems | LoadedBreakdown;

export function DrillDownModal({ kind, item, filters, onClose }: Props) {
  const [data, setData] = useState<Loaded | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const load = async () => {
      try {
        if (kind === 'store') {
          const res = await statisticsApi.getReceiptsByStore(item.id ?? '', filters);
          setData({ mode: 'receipts', items: res.items, total: res.total });
        } else if (kind === 'transaction-category' && item.id != null) {
          // Sub-breakdown: which stores make up this category's spend.
          const res = await statisticsApi.getByStore({
            ...filters,
            transactionCategoryId: [item.id],
            storeId: undefined,
          });
          setData({ mode: 'breakdown', items: res.items, totalAmount: res.totalAmount });
        } else if (kind === 'transaction-category') {
          // NULL bucket ("Без категорії") → flat receipts.
          const res = await statisticsApi.getReceiptsByTransactionCategory(item.id, filters);
          setData({ mode: 'receipts', items: res.items, total: res.total });
        } else if (kind === 'payment-method' && item.id != null) {
          // Grouped breakdown: which stores were used within this payment method.
          const res = await statisticsApi.getByStore({
            ...filters,
            paymentMethodId: [item.id],
            storeId: undefined,
          });
          setData({ mode: 'breakdown', items: res.items, totalAmount: res.totalAmount });
        } else if (kind === 'payment-method') {
          const res = await statisticsApi.getReceiptsByPaymentMethod(item.id, filters);
          setData({ mode: 'receipts', items: res.items, total: res.total });
        } else {
          const res = await statisticsApi.getItemsByItemCategory(item.id, filters);
          setData({ mode: 'items', items: res.items, total: res.total });
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Помилка завантаження');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [kind, item.id, filters]);

  const header = HEADERS[kind];
  const receipts = data?.mode === 'receipts' ? data.items : null;
  const items = data?.mode === 'items' ? data.items : null;
  const breakdown = data?.mode === 'breakdown' ? data.items : null;
  const total =
    data?.mode === 'breakdown' ? data.items.length : data?.total ?? 0;
  const shown = data?.items.length ?? 0;
  const breakdownMax =
    breakdown && breakdown.length > 0
      ? Math.max(...breakdown.map((b) => b.totalAmount))
      : 0;
  const breakdownColor = chartColorScale((breakdown ?? []).map((b) => b.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="flex w-[520px] max-w-full flex-col rounded-xl bg-white shadow-xl"
        style={{ maxHeight: 'min(560px, calc(100vh - 32px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#e5e7eb] p-5">
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">{item.name}</h2>
            <p className="tnum mt-0.5 text-[12px] text-[#9ca3af]">
              {fmtMoney(item.totalAmount)} ₴ · {item.count} {header.suffix}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="mb-2 h-8 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div className="m-5 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
              {error}
            </div>
          )}

          {!isLoading && !error && breakdown && (
            <>
              {breakdown.map((b, idx) => {
                const barPct =
                  breakdownMax === 0 ? 0 : (b.totalAmount / breakdownMax) * 100;
                return (
                  <div
                    key={`${b.id ?? 'none'}-${idx}`}
                    className="border-b border-[#e5e7eb] px-4 py-3 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[13px] text-[#1a1a1a]">{b.name}</span>
                      <span className="tnum text-[13px] font-medium text-[#1a1a1a]">
                        {fmtMoney(b.totalAmount)} ₴
                      </span>
                    </div>
                    <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#F0F0F0]">
                      <div
                        className="h-full"
                        style={{ width: `${barPct}%`, backgroundColor: breakdownColor(b.id) }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-[#9ca3af]">
                      <span>{b.count} {header.suffix}</span>
                      <span className="tnum">{b.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}

              {breakdown.length === 0 && (
                <div className="px-4 py-8 text-center text-[13px] text-[#9ca3af]">
                  Немає записів
                </div>
              )}
            </>
          )}

          {!isLoading && !error && !breakdown && (
            <>
              <div
                className="grid text-[11px] uppercase tracking-wide text-[#0F6E56]"
                style={{
                  gridTemplateColumns:
                    kind === 'item-category'
                      ? '2fr 1.4fr 0.8fr 0.8fr'
                      : '1.4fr 1.4fr 0.8fr',
                  padding: '8px 16px',
                  backgroundColor: 'var(--brand-soft, #E1F5EE)',
                }}
              >
                {header.cols.map((c, i) => (
                  <span key={c} className={i === header.cols.length - 1 ? 'text-right' : ''}>
                    {c}
                  </span>
                ))}
              </div>

              {(kind === 'transaction-category' || kind === 'payment-method') && receipts?.map((r) => (
                <div
                  key={r.id}
                  className="grid items-center border-b border-[#e5e7eb] px-4 py-2.5"
                  style={{ gridTemplateColumns: '1.4fr 1.4fr 0.8fr' }}
                >
                  <span className="truncate text-[13px] text-[#1a1a1a]">
                    {r.storeName ?? '—'}
                  </span>
                  <span className="text-[13px] text-[#6b7280]">
                    {formatShortDate(r.receiptDate)}
                  </span>
                  <span className="tnum text-right text-[13px] font-medium text-[#1a1a1a]">
                    {fmtMoney(r.totalAmount)} ₴
                  </span>
                </div>
              ))}

              {kind === 'store' && receipts?.map((r) => (
                <div
                  key={r.id}
                  className="grid items-center border-b border-[#e5e7eb] px-4 py-2.5"
                  style={{ gridTemplateColumns: '1.4fr 1.4fr 0.8fr' }}
                >
                  <span className="text-[13px] text-[#6b7280]">
                    {formatShortDate(r.receiptDate)}
                  </span>
                  <span className="truncate text-[13px] text-[#1a1a1a]">
                    {r.transactionCategoryName ?? 'Без категорії'}
                  </span>
                  <span className="tnum text-right text-[13px] font-medium text-[#1a1a1a]">
                    {fmtMoney(r.totalAmount)} ₴
                  </span>
                </div>
              ))}

              {kind === 'item-category' && items?.map((it, idx) => (
                <div
                  key={`${it.name}-${idx}`}
                  className="grid items-center border-b border-[#e5e7eb] px-4 py-2.5"
                  style={{ gridTemplateColumns: '2fr 1.4fr 0.8fr 0.8fr' }}
                >
                  <span className="truncate text-[13px] text-[#1a1a1a]">{it.name}</span>
                  <span className="truncate text-[13px] text-[#6b7280]">{it.storeName ?? '—'}</span>
                  <span className="tnum text-[13px] text-[#6b7280]">
                    {it.quantity}{it.unit ? ` ${it.unit}` : ''}
                  </span>
                  <span className="tnum text-right text-[13px] font-medium text-[#1a1a1a]">
                    {fmtMoney(it.totalPrice)} ₴
                  </span>
                </div>
              ))}

              {!isLoading && shown === 0 && (
                <div className="px-4 py-8 text-center text-[13px] text-[#9ca3af]">
                  Немає записів
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-between border-t border-[#e5e7eb] p-4">
          <span className="text-[12px] text-[#9ca3af]">
            {breakdown ? `${shown} записів` : `Показано ${shown} з ${total}`}
          </span>
          <div className="flex items-center gap-3">
            {(kind === 'store' || kind === 'transaction-category') && item.id != null && (
              <Link
                href={buildViewAllHref(kind, item.id, filters)}
                onClick={onClose}
                className="text-[12px] text-[#0F6E56] underline hover:opacity-80"
              >
                Переглянути всі у Чеках →
              </Link>
            )}
            <Button
              fullWidth={false}
              className="py-2 px-4 text-[12px]"
              onClick={onClose}
            >
              Закрити
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
