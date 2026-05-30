'use client';

import { useState } from 'react';

export type PeriodKey = 'week' | 'month' | 'year' | 'custom';

interface Props {
  period: PeriodKey;
  dateFrom: string;
  dateTo: string;
  onChange: (period: PeriodKey, dateFrom: string, dateTo: string) => void;
}

const LABELS: Record<PeriodKey, string> = {
  week: 'Тиждень',
  month: 'Місяць',
  year: 'Рік',
  custom: 'Свій',
};

function isoDay(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns dateFrom/dateTo (ISO 'YYYY-MM-DD') for a preset period.
 * Today is the upper bound for week/month/year.
 */
export function presetRange(period: Exclude<PeriodKey, 'custom'>): {
  dateFrom: string;
  dateTo: string;
} {
  const today = new Date();
  const todayIso = isoDay(today);
  if (period === 'week') {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - 6);
    return { dateFrom: isoDay(d), dateTo: todayIso };
  }
  if (period === 'month') {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    return { dateFrom: isoDay(d), dateTo: todayIso };
  }
  // year
  const d = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  return { dateFrom: isoDay(d), dateTo: todayIso };
}

export function PeriodTabs({ period, dateFrom, dateTo, onChange }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);

  const handleTabClick = (key: PeriodKey) => {
    if (key === 'custom') {
      setDraftFrom(dateFrom);
      setDraftTo(dateTo);
      setCustomOpen((v) => !v);
      return;
    }
    setCustomOpen(false);
    const range = presetRange(key);
    onChange(key, range.dateFrom, range.dateTo);
  };

  const handleCustomApply = () => {
    onChange('custom', draftFrom, draftTo);
    setCustomOpen(false);
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-0.5 rounded-lg p-[3px]"
        style={{ backgroundColor: '#F7F7F7' }}
      >
        {(Object.keys(LABELS) as PeriodKey[]).map((key) => {
          const active = period === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTabClick(key)}
              className="rounded-md px-3 py-1.5 text-[12px] transition-colors"
              style={{
                backgroundColor: active ? '#fff' : 'transparent',
                color: active ? '#1a1a1a' : '#6b7280',
                fontWeight: active ? 500 : 400,
                border: active ? '0.5px solid #e5e7eb' : '0.5px solid transparent',
              }}
            >
              {key === 'custom' && period === 'custom'
                ? `${dateFrom.slice(5)} – ${dateTo.slice(5)}`
                : LABELS[key]}
            </button>
          );
        })}
      </div>

      {customOpen && (
        <div className="absolute right-0 top-11 z-20 w-[300px] rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-md">
          <p className="mb-2 text-[12px] text-[#9ca3af]">Власний діапазон</p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">Від</label>
              <input
                type="date"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="h-[32px] w-full rounded-md border border-[#e5e7eb] px-2 text-[12px] outline-none focus:border-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">До</label>
              <input
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                onChange={(e) => setDraftTo(e.target.value)}
                className="h-[32px] w-full rounded-md border border-[#e5e7eb] px-2 text-[12px] outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCustomOpen(false)}
              className="px-3 py-1.5 text-[12px] text-[#6b7280] hover:underline"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={handleCustomApply}
              disabled={!draftFrom || !draftTo}
              className="rounded-md bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white disabled:opacity-50"
            >
              Застосувати
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
