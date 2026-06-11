'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { categoryColor, NO_CATEGORY_CHART_COLOR } from '@/src/lib/category-colors';
import type { BreakdownItem } from '@/src/types/statistics.types';

interface Props {
  data: BreakdownItem[] | null;
  totalAmount: number;
  isLoading: boolean;
  onSegmentClick?: (item: BreakdownItem) => void;
}

function colorFor(item: BreakdownItem): string {
  if (item.id === null || item.id === 'none') return NO_CATEGORY_CHART_COLOR;
  return categoryColor(item.id).solid;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('uk-UA', { maximumFractionDigits: 0 });
}

export function DonutChart({ data, totalAmount, isLoading, onSegmentClick }: Props) {
  if (isLoading && !data) {
    return (
      <div className="card-surface rounded-[14px] p-5">
        <Skeleton className="mb-3 h-3 w-32" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card-surface rounded-[14px] p-5">
        <p className="mb-3 text-[13px] font-medium text-[#1a1a1a]">По категоріях транзакцій</p>
        <div className="flex h-[200px] items-center justify-center text-[13px] text-[#9ca3af]">
          Немає даних
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    color: colorFor(d),
  }));

  return (
    <div className="card-surface rounded-[14px] p-5">
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
                isAnimationActive
                animationDuration={400}
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
            <span className="tnum text-[24px] font-semibold text-[#1a1a1a]">{fmtMoney(totalAmount)}</span>
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
              <span className="tnum text-[12px] font-medium text-[#1a1a1a]">
                {d.percentage.toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
