'use client';

import { useState } from 'react';
import { Skeleton } from '@/src/components/ui/Skeleton';
import type { TimelineResponse, Granularity } from '@/src/types/statistics.types';

interface Props {
  data: TimelineResponse | null;
  isLoading: boolean;
}

const UK_MONTHS_SHORT = [
  'Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв',
  'Лип', 'Серп', 'Вер', 'Жовт', 'Лист', 'Груд',
];
const UK_DAYS_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatTick(iso: string, granularity: Granularity): string {
  const d = new Date(iso);
  if (granularity === 'day') {
    return `${d.getUTCDate()} ${UK_DAYS_SHORT[d.getUTCDay()]}`;
  }
  if (granularity === 'week') {
    return `${d.getUTCDate()} ${UK_MONTHS_SHORT[d.getUTCMonth()]}`;
  }
  return UK_MONTHS_SHORT[d.getUTCMonth()];
}

function fmtMoney(n: number): string {
  return n.toLocaleString('uk-UA', { maximumFractionDigits: 0 });
}

/**
 * Bar with rounded TOP corners only. The svg is stretched
 * (preserveAspectRatio="none": x in 0–100 viewBox units, y in px), so the
 * corner radii are given separately per axis and drawn with quadratic curves.
 */
function topRoundedBarPath(x: number, y: number, w: number, h: number): string {
  if (h <= 0 || w <= 0) return '';
  const ry = Math.min(3, h); // ≈3px vertical radius
  const rx = Math.min(0.6, w / 2); // ≈3px horizontal radius after stretch
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + ry}`,
    `Q ${x} ${y} ${x + rx} ${y}`,
    `L ${x + w - rx} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + ry}`,
    `L ${x + w} ${y + h}`,
    'Z',
  ].join(' ');
}

export function TimelineChart({ data, isLoading }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (isLoading && !data) {
    return (
      <div className="card-surface rounded-[14px] p-5">
        <Skeleton className="mb-3 h-3 w-32" />
        <Skeleton className="h-[160px] w-full" />
      </div>
    );
  }

  if (!data || data.points.length === 0) {
    return (
      <div className="card-surface flex flex-col items-center justify-center rounded-[14px] py-10">
        <p className="text-[13px] text-[#9ca3af]">Немає даних за цей період</p>
      </div>
    );
  }

  const max = Math.max(...data.points.map((p) => p.totalAmount), 0);
  const titleByGranularity: Record<Granularity, string> = {
    day: 'Витрати по днях',
    week: 'Витрати по тижнях',
    month: 'Витрати по місяцях',
  };

  // SVG geometry
  const width = 100; // viewBox %
  const height = 160; // px
  const padTop = 8;
  const padBottom = 24;
  const padLeft = 0;
  const padRight = 0;
  const innerH = height - padTop - padBottom;
  const n = data.points.length;
  const gap = 4; // px between bars
  const barW = Math.max(2, (100 - padLeft - padRight) / n - gap * 0.05);

  return (
    <div className="card-surface rounded-[14px] p-5">
      <p className="mb-1 text-[13px] font-medium text-[#1a1a1a]">
        {titleByGranularity[data.granularity]}
      </p>
      <p className="tnum mb-3 text-[11px] text-[#9ca3af]">
        Максимум: {fmtMoney(max)} ₴ · точок: {n}
      </p>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height }}
        >
          {/* Y-axis grid lines */}
          {[0, 0.5, 1].map((frac) => (
            <line
              key={frac}
              x1={0}
              x2={width}
              y1={padTop + innerH * (1 - frac)}
              y2={padTop + innerH * (1 - frac)}
              stroke="#e5e7eb"
              strokeWidth={0.2}
            />
          ))}

          {data.points.map((p, idx) => {
            const h = max === 0 ? 0 : (p.totalAmount / max) * innerH;
            const x = (idx / n) * (width - padLeft - padRight) + padLeft + 0.5;
            const y = padTop + innerH - h;
            return (
              <path
                key={p.period}
                d={topRoundedBarPath(x, y, barW - 1, h)}
                fill={hoverIdx === idx ? 'var(--brand-strong)' : 'var(--brand)'}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </svg>

        {/* Y-axis labels (overlay) */}
        <div className="tnum pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between py-[8px] pb-[24px] pl-1 text-[10px] text-[#9ca3af]">
          <span>{fmtMoney(max)}</span>
          <span>{fmtMoney(max / 2)}</span>
          <span>0</span>
        </div>

        {/* X-axis labels */}
        <div className="mt-1 flex justify-between text-[10px] text-[#9ca3af]">
          {data.points.map((p, idx) => {
            // Show every Nth label to avoid clutter
            const step = Math.max(1, Math.ceil(n / 8));
            const show = idx % step === 0 || idx === n - 1;
            return (
              <span key={p.period} style={{ width: `${100 / n}%` }} className="text-center">
                {show ? formatTick(p.period, data.granularity) : ''}
              </span>
            );
          })}
        </div>

        {/* Tooltip */}
        {hoverIdx !== null && data.points[hoverIdx] && (
          <div
            className="pointer-events-none absolute rounded-md bg-[#1a1a1a] px-2 py-1 text-[11px] text-white shadow-md"
            style={{
              left: `${(hoverIdx / n) * 100}%`,
              top: 0,
              transform: 'translate(-50%, -110%)',
              whiteSpace: 'nowrap',
            }}
          >
            <div>{formatTick(data.points[hoverIdx].period, data.granularity)}</div>
            <div className="tnum font-medium">
              {fmtMoney(data.points[hoverIdx].totalAmount)} ₴
            </div>
            <div className="opacity-70">{data.points[hoverIdx].receiptsCount} чеків</div>
          </div>
        )}
      </div>
    </div>
  );
}
