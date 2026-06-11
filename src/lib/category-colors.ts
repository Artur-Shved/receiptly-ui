/**
 * "Color as data" palette (web-design-refresh.md §4).
 *
 * A UUID (category, store, …) deterministically maps to one of 10 color
 * pairs, so the same entity is tinted identically everywhere it appears:
 * badges, donut segments, breakdown progress bars, store avatars.
 */

export interface CategoryColor {
  /** Tinted background for badges/avatars. */
  bg: string;
  /** Text/icon color on top of `bg`. */
  text: string;
  /** Saturated color for charts (donut segments, bars, dots). */
  solid: string;
}

const PALETTE: CategoryColor[] = [
  { bg: '#E1F5EE', text: '#0F6E56', solid: '#0F6E56' }, // teal
  { bg: '#E6F1FB', text: '#185FA5', solid: '#185FA5' }, // blue
  { bg: '#FAEEDA', text: '#854F0B', solid: '#B45309' }, // amber
  { bg: '#EAF3DE', text: '#3B6D11', solid: '#5A8F26' }, // green
  { bg: '#EDE9FE', text: '#6D28D9', solid: '#6D28D9' }, // purple
  { bg: '#FFEDD5', text: '#C2410C', solid: '#C2410C' }, // coral
  { bg: '#FCE7F3', text: '#BE185D', solid: '#BE185D' }, // pink
  { bg: '#CFFAFE', text: '#0E7490', solid: '#0E7490' }, // cyan
  { bg: '#E0E7FF', text: '#4338CA', solid: '#4338CA' }, // indigo
  { bg: '#E2E8F0', text: '#475569', solid: '#64748B' }, // slate
];

/** Neutral color for the NULL bucket ("Без категорії") in charts. */
export const NO_CATEGORY_CHART_COLOR = '#94A3B8';

/**
 * Stable string hash (djb2). UUIDs are uniformly distributed, so a simple
 * hash spreads entities evenly across the palette.
 */
function hash(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = (h * 33) ^ id.charCodeAt(i);
  }
  return Math.abs(h);
}

/**
 * Returns the deterministic color pair for an entity id.
 * `null`/`undefined` (no category) falls back to the slate pair — note that
 * "Без кат." badges keep their dedicated warning style and should NOT use
 * this fallback for badge styling (only charts use NO_CATEGORY_CHART_COLOR).
 */
export function categoryColor(id: string | null | undefined): CategoryColor {
  if (!id) return PALETTE[9];
  return PALETTE[hash(id) % PALETTE.length];
}
