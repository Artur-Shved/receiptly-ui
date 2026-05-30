'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { BreakdownItem } from '@/src/types/statistics.types';

interface Props {
  data: BreakdownItem[] | null;
  totalAmount: number;
  isLoading: boolean;
  onSegmentClick?: (item: BreakdownItem) => void;
}

const CATEGORY_PALETTE = [
  '#1a1a1a',
  '#5DCAA5',
  '#EF9F27',
  '#378ADD',
  '#D85A30',
  '#534AB7',
  '#3B6D11',
];
const NO_CATEGORY_COLOR = '#d1d5db';

function colorFor(item: BreakdownItem, idx: number): string {
  if (item.id === null) return NO_CATEGORY_COLOR;
  return CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
}

function fmtMoney(n: number): string {
  return n.toLocaleString('uk-UA', { maximumFractionDigits: 0 });
}

export function DonutChart({ data, totalAmount, isLoading, onSegmentClick }: Props) {
  if (isLoading && !data) {
    return (
      <div className="rounded-xl bg-white p-5" style={{ border: '0.5px solid #e5e7eb' }}>
        <div className="mb-3 h-3 w-32 rounded bg-[#F0F0F0]" />
        <div className="h-[200px] w-full rounded bg-[#F7F7F7]" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5" style={{ border: '0.5px solid #e5e7eb' }}>
        <p className="mb-3 text-[13px] font-medium text-[#1a1a1a]">По категоріях транзакцій</p>
        <div className="flex h-[200px] items-center justify-center text-[13px] text-[#9ca3af]">
          Немає даних
        </div>
      </div>
    );
  }

  const chartData = data.map((d, idx) => ({
    ...d,
    color: colorFor(d, idx),
  }));

  return (
    <div className="rounded-xl bg-white p-5" style={{ border: '0.5px solid #e5e7eb' }}>
      <p className="mb-3 text-[13px] font-medium text-[#1a1a1a]">По категоріях транзакцій</p>

      <div className="flex items-center gap-4">
        <div style={{ width: 180, height: 180, position: 'relative' }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="totalAmount"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={1}
                stroke="#fff"
                strokeWidth={1}
                onClick={(d: { payload?: BreakdownItem }) => d?.payload && onSegmentClick?.(d.payload)}
              >
                {chartData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.color}
                    style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${fmtMoney(Number(value ?? 0))} ₴`, '']}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: '0.5px solid #e5e7eb',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          >
            <span className="text-[18px] font-medium text-[#1a1a1a]">{fmtMoney(totalAmount)}</span>
            <span className="text-[11px] text-[#9ca3af]">грн</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {chartData.map((d, idx) => (
            <button
              key={`legend-${idx}`}
              type="button"
              onClick={() => onSegmentClick?.(d)}
              className="flex items-center gap-2 text-left hover:opacity-80"
              disabled={!onSegmentClick}
            >
              <span
                className="h-[10px] w-[10px] flex-shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="flex-1 truncate text-[12px] text-[#6b7280]">{d.name}</span>
              <span className="text-[12px] font-medium text-[#1a1a1a]">
                {d.percentage.toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
