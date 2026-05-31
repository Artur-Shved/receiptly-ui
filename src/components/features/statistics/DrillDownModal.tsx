'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { statisticsApi } from '@/src/api/statistics.api';
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

const HEADERS: Record<DrillKind, { suffix: string; cols: string[] }> = {
  'transaction-category': { suffix: 'чеків', cols: ['Магазин', 'Дата', 'Сума'] },
  store: { suffix: 'чеків', cols: ['Дата', 'Категорія', 'Сума'] },
  'item-category': { suffix: 'товарів', cols: ['Назва', 'Магазин', 'К-сть', 'Сума'] },
  'payment-method': { suffix: 'чеків', cols: ['Магазин', 'Дата', 'Сума'] },
};

export function DrillDownModal({ kind, item, filters, onClose }: Props) {
  const [receipts, setReceipts] = useState<ReceiptDrillDownItem[] | null>(null);
  const [items, setItems] = useState<ItemDrillDownItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const load = async () => {
      try {
        if (kind === 'transaction-category') {
          const res = await statisticsApi.getReceiptsByTransactionCategory(item.id, filters);
          setReceipts(res.items);
          setTotal(res.total);
        } else if (kind === 'store') {
          const res = await statisticsApi.getReceiptsByStore(item.id ?? '', filters);
          setReceipts(res.items);
          setTotal(res.total);
        } else if (kind === 'payment-method') {
          const res = await statisticsApi.getReceiptsByPaymentMethod(item.id, filters);
          setReceipts(res.items);
          setTotal(res.total);
        } else {
          const res = await statisticsApi.getItemsByItemCategory(item.id, filters);
          setItems(res.items);
          setTotal(res.total);
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
  const shown =
    kind === 'item-category' ? items?.length ?? 0 : receipts?.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-[520px] max-w-[calc(100%-32px)] rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#e5e7eb] p-5">
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">{item.name}</h2>
            <p className="mt-0.5 text-[12px] text-[#9ca3af]">
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

        <div className="max-h-[480px] overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-10 text-[13px] text-[#9ca3af]">
              Завантаження...
            </div>
          )}

          {error && (
            <div className="m-5 rounded-md bg-[#FCEBEB] px-3 py-2 text-[13px] text-[#A32D2D]">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div
                className="grid text-[11px] uppercase tracking-wide text-[#9ca3af]"
                style={{
                  gridTemplateColumns:
                    kind === 'item-category'
                      ? '2fr 1.4fr 0.8fr 0.8fr'
                      : '1.4fr 1.4fr 0.8fr',
                  padding: '8px 16px',
                  backgroundColor: '#F7F7F7',
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
                  <span className="text-right text-[13px] font-medium text-[#1a1a1a]">
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
                  <span className="text-right text-[13px] font-medium text-[#1a1a1a]">
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
                  <span className="text-[13px] text-[#6b7280]">
                    {it.quantity}{it.unit ? ` ${it.unit}` : ''}
                  </span>
                  <span className="text-right text-[13px] font-medium text-[#1a1a1a]">
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

        <div className="flex items-center justify-between border-t border-[#e5e7eb] p-4">
          <span className="text-[12px] text-[#9ca3af]">
            Показано {shown} з {total}
          </span>
          <Button
            variant="secondary"
            fullWidth={false}
            className="py-2 px-4 text-[12px]"
            onClick={onClose}
          >
            Закрити
          </Button>
        </div>
      </div>
    </div>
  );
}
