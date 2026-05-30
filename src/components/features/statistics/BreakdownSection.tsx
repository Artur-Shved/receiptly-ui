'use client';

import type { BreakdownItem } from '@/src/types/statistics.types';

interface Props {
  title: string;
  items: BreakdownItem[] | null;
  isLoading: boolean;
  /** "N чеків" or "N од." — formatting depends on which breakdown */
  countSuffix: (count: number) => string;
  onItemClick: (item: BreakdownItem) => void;
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
  maxRows = 5,
}: Props) {
  const visible = items?.slice(0, maxRows) ?? [];
  const maxAmount = visible.length > 0 ? Math.max(...visible.map((i) => i.totalAmount)) : 0;

  return (
    <div
      className="overflow-hidden rounded-xl bg-white"
      style={{ border: '0.5px solid #e5e7eb' }}
    >
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
        <p className="text-[13px] font-medium text-[#1a1a1a]">{title}</p>
        {items && items.length > maxRows && (
          <span className="text-[12px] text-[#9ca3af]">+{items.length - maxRows} ще</span>
        )}
      </div>

      {isLoading && !items && (
        <div className="px-4 py-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="mb-3 h-9 rounded bg-[#F7F7F7]" />
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
              <span className="text-[13px] font-medium text-[#1a1a1a]">
                {fmtMoney(item.totalAmount)}
              </span>
            </div>
            <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#F0F0F0]">
              <div
                className="h-full"
                style={{ width: `${barPct}%`, backgroundColor: '#1a1a1a' }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-[#9ca3af]">
              <span>{countSuffix(item.count)}</span>
              <span>{item.percentage.toFixed(1)}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
