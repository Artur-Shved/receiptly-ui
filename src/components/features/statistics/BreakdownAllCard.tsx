'use client';

import { ArrowLeft } from 'lucide-react';
import type { BreakdownItem } from '@/src/types/statistics.types';

interface Props {
  title: string;
  items: BreakdownItem[];
  countSuffix: (count: number) => string;
  onItemClick: (item: BreakdownItem) => void;
  onBack: () => void;
}

function fmtMoney(n: number): string {
  return `${n.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴`;
}

/**
 * Full-width card showing the complete list of items for a single
 * breakdown. Replaces the 3-column grid on the statistics page when
 * the user picks "Усі" on one of the breakdown sections.
 */
export function BreakdownAllCard({
  title,
  items,
  countSuffix,
  onItemClick,
  onBack,
}: Props) {
  const maxAmount = items.length > 0 ? Math.max(...items.map((i) => i.totalAmount)) : 0;

  return (
    <div className="overflow-hidden rounded-xl bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-[12px] text-[#6b7280] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <ArrowLeft size={13} /> Назад до огляду
          </button>
          <p className="text-[13px] font-medium text-[#1a1a1a]">{title}</p>
        </div>
        <span className="text-[12px] text-[#9ca3af]">{items.length} записів</span>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center text-[12px] text-[#9ca3af]">
          Немає даних за період
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto">
          {items.map((item, idx) => {
            const barPct = maxAmount === 0 ? 0 : (item.totalAmount / maxAmount) * 100;
            return (
              <button
                key={`${item.id ?? 'none'}-${idx}`}
                type="button"
                onClick={() => onItemClick(item)}
                className="block w-full border-b border-[#e5e7eb] px-4 py-3 text-left last:border-b-0 hover:bg-[#FAFAFA]"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-[13px] text-[#1a1a1a]">{item.name}</span>
                  <span className="text-[13px] font-medium text-[#1a1a1a]">
                    {fmtMoney(item.totalAmount)}
                  </span>
                </div>
                <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#F0F0F0]">
                  <div className="h-full" style={{ width: `${barPct}%`, backgroundColor: '#1a1a1a' }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-[#9ca3af]">
                  <span>{countSuffix(item.count)}</span>
                  <span>{item.percentage.toFixed(1)}%</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
