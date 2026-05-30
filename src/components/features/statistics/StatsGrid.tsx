'use client';

import { Coins, Receipt, TrendingDown, TrendingUp } from 'lucide-react';
import type { SummaryResponse } from '@/src/types/statistics.types';

interface Props {
  summary: SummaryResponse | null;
  isLoading: boolean;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function Trend({ delta, invertColor = false }: { delta: number | null; invertColor?: boolean }) {
  if (delta === null) {
    return <span className="text-[12px] text-[#9ca3af]">немає попереднього періоду</span>;
  }
  if (delta === 0) {
    return <span className="text-[12px] text-[#9ca3af]">без змін</span>;
  }
  const isUp = delta > 0;
  // For expenses: up = bad (red), down = good (green). For receipts count: up = neutral.
  const color = invertColor
    ? '#9ca3af'
    : isUp
      ? '#A32D2D'
      : '#3B6D11';
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span className="flex items-center gap-1 text-[12px]" style={{ color }}>
      <Icon size={12} />
      {isUp ? '+' : ''}
      {delta}% до попереднього періоду
    </span>
  );
}

function Card({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-4" style={{ border: '0.5px solid #e5e7eb' }}>
      <div className="mb-2 flex items-center gap-2 text-[12px] text-[#6b7280]">
        {icon}
        {label}
      </div>
      <p className="text-[24px] font-medium text-[#1a1a1a]">{value}</p>
      {trend && <div className="mt-1">{trend}</div>}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4" style={{ border: '0.5px solid #e5e7eb' }}>
      <div className="mb-2 h-3 w-24 rounded bg-[#F0F0F0]" />
      <div className="h-7 w-20 rounded bg-[#F0F0F0]" />
      <div className="mt-2 h-3 w-32 rounded bg-[#F0F0F0]" />
    </div>
  );
}

function fmtMoney(n: number): string {
  return `${n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴`;
}

export function StatsGrid({ summary, isLoading }: Props) {
  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!summary) return null;

  const totalDelta = pctChange(summary.totalAmount, summary.previous.totalAmount);
  const countDelta = pctChange(summary.receiptsCount, summary.previous.receiptsCount);
  const avgDelta = pctChange(summary.avgAmount, summary.previous.avgAmount);

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card
        label="Витрати за період"
        value={fmtMoney(summary.totalAmount)}
        icon={<Coins size={14} />}
        trend={<Trend delta={totalDelta} />}
      />
      <Card
        label="Кількість чеків"
        value={summary.receiptsCount.toString()}
        icon={<Receipt size={14} />}
        trend={<Trend delta={countDelta} invertColor />}
      />
      <Card
        label="Середній чек"
        value={fmtMoney(summary.avgAmount)}
        icon={<Receipt size={14} />}
        trend={<Trend delta={avgDelta} />}
      />
    </div>
  );
}
