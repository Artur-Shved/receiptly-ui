'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

const UK_MONTHS_LONG = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
];
const UK_MONTHS_SHORT = [
  'січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
  'лип', 'серп', 'вер', 'жовт', 'лист', 'груд',
];

function isoDay(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Returns the calendar-aligned date window for a given preset shifted by
 * `offset` units backwards (0 = current, -1 = previous, etc.). For
 * offset === 0 the upper bound is clamped to today; older periods use the
 * full calendar end.
 */
export function rangeForPreset(
  period: Exclude<PeriodKey, 'custom'>,
  offset: number,
): { dateFrom: string; dateTo: string; label: string } {
  const today = todayUtc();
  if (period === 'month') {
    const target = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1));
    const monthEnd = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0));
    const upper = offset === 0 ? today : monthEnd;
    return {
      dateFrom: isoDay(target),
      dateTo: isoDay(upper),
      label: `${UK_MONTHS_LONG[target.getUTCMonth()]} ${target.getUTCFullYear()}`,
    };
  }
  if (period === 'year') {
    const year = today.getUTCFullYear() + offset;
    const from = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));
    const upper = offset === 0 ? today : yearEnd;
    return {
      dateFrom: isoDay(from),
      dateTo: isoDay(upper),
      label: `${year}`,
    };
  }
  // ISO week: Mon..Sun
  const dayIdx = today.getUTCDay() || 7; // Mon=1..Sun=7
  const monThis = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - dayIdx + 1),
  );
  const monTarget = new Date(
    Date.UTC(monThis.getUTCFullYear(), monThis.getUTCMonth(), monThis.getUTCDate() + offset * 7),
  );
  const sunTarget = new Date(
    Date.UTC(monTarget.getUTCFullYear(), monTarget.getUTCMonth(), monTarget.getUTCDate() + 6),
  );
  const upper = offset === 0 ? today : sunTarget;
  const label =
    monTarget.getUTCMonth() === sunTarget.getUTCMonth()
      ? `${monTarget.getUTCDate()}–${sunTarget.getUTCDate()} ${UK_MONTHS_SHORT[monTarget.getUTCMonth()]}`
      : `${monTarget.getUTCDate()} ${UK_MONTHS_SHORT[monTarget.getUTCMonth()]} – ${sunTarget.getUTCDate()} ${UK_MONTHS_SHORT[sunTarget.getUTCMonth()]}`;
  return { dateFrom: isoDay(monTarget), dateTo: isoDay(upper), label };
}

/** Kept as a backward-compatible helper for callers that just want the
 * current-period range (offset 0). */
export function presetRange(period: Exclude<PeriodKey, 'custom'>): {
  dateFrom: string;
  dateTo: string;
} {
  const { dateFrom, dateTo } = rangeForPreset(period, 0);
  return { dateFrom, dateTo };
}

export function PeriodTabs({ period, dateFrom, dateTo, onChange }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);
  const [offset, setOffset] = useState(0);

  const handleTabClick = (key: PeriodKey) => {
    if (key === 'custom') {
      setDraftFrom(dateFrom);
      setDraftTo(dateTo);
      setCustomOpen((v) => !v);
      return;
    }
    setCustomOpen(false);
    setOffset(0);
    const range = rangeForPreset(key, 0);
    onChange(key, range.dateFrom, range.dateTo);
  };

  const stepOffset = (delta: number) => {
    if (period === 'custom') return;
    const nextOffset = Math.min(0, offset + delta);
    if (nextOffset === offset) return;
    setOffset(nextOffset);
    const range = rangeForPreset(period, nextOffset);
    onChange(period, range.dateFrom, range.dateTo);
  };

  const handleCustomApply = () => {
    onChange('custom', draftFrom, draftTo);
    setCustomOpen(false);
  };

  const navLabel =
    period !== 'custom' ? rangeForPreset(period, offset).label : null;

  return (
    <div className="flex flex-col items-end gap-2">
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

      {/* Navigation row — only for non-custom presets */}
      {navLabel && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => stepOffset(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
            aria-label="Попередній період"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[140px] text-center text-[12px] font-medium text-[#1a1a1a]">
            {navLabel}
          </span>
          <button
            type="button"
            onClick={() => stepOffset(1)}
            disabled={offset >= 0}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#F7F7F7] hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Наступний період"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
