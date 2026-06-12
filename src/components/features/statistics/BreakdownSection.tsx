'use client';

import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { chartColorScale } from '@/src/lib/category-colors';
import type { BreakdownItem } from '@/src/types/statistics.types';

interface Props {
  title: string;
  items: BreakdownItem[] | null;
  isLoading: boolean;
  /** "N чеків" or "N од." — formatting depends on which breakdown */
  countSuffix: (count: number) => string;
  onItemClick: (item: BreakdownItem) => void;
  /** Optional handler for the "show all" affordance. When omitted, the
   *  section only renders the top `maxRows` items and shows nothing extra. */
  onShowAll?: () => void;
  maxRows?: number;
}

function fmtMoney(n: number): string {
  return `${n.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴`;
}

export function BreakdownSection({
  title,
  items,
  isLoading,
  countSuffix,
  onItemClick,
  onShowAll,
  maxRows = 5,
}: Props) {
  const hasMore = items != null && items.length > maxRows;
  const visible = items?.slice(0, maxRows) ?? [];
  // Scale over the FULL list so the top-5 view and the show-all view agree.
  const barColor = chartColorScale((items ?? []).map((i) => i.id));
  const maxAmount = visible.length > 0 ? Math.max(...visible.map((i) => i.totalAmount)) : 0;

  return (
    <div className="card-surface overflow-hidden rounded-[14px]">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
        <p className="text-[13px] font-medium text-[#1a1a1a]">{title}</p>
        {hasMore && onShowAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] text-[#1a1a1a] hover:bg-[#F7F7F7]"
          >
            +{items!.length - maxRows} ще <ChevronRight size={12} />
          </button>
        )}
      </div>

      {isLoading && !items && (
        <div className="px-4 py-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="mb-3 h-9 w-full" />
          ))}
        </div>
      )}

      {!isLoading && (!items || items.length === 0) && (
        <div className="px-4 py-8 text-center text-[12px] text-[#9ca3af]">
          Немає даних за період
        </div>
      )}

      {visible.map((item, idx) => {
        const barPct = maxAmount === 0 ? 0 : (item.totalAmount / maxAmount) * 100;
        return (
          <button
            key={`${item.id ?? 'none'}-${idx}`}
            type="button"
            onClick={() => onItemClick(item)}
            className="block w-full border-b border-[#e5e7eb] px-4 py-2.5 text-left last:border-b-0 hover:bg-[#FAFAFA]"
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-[13px] text-[#1a1a1a]">{item.name}</span>
              <span className="tnum text-[13px] font-medium text-[#1a1a1a]">
                {fmtMoney(item.totalAmount)}
              </span>
            </div>
            <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#F0F0F0]">
              <div
                className="h-full"
                style={{ width: `${barPct}%`, backgroundColor: barColor(item.id) }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-[#9ca3af]">
              <span>{countSuffix(item.count)}</span>
              <span className="tnum">{item.percentage.toFixed(1)}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
