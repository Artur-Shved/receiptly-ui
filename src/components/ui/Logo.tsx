/**
 * Coino brand logo for the web app — a faithful port of the mobile
 * `components/ui/logo.tsx` (react-native-svg) to plain DOM SVG. Source of
 * truth: `receiptly-mobile/assets/logo/*.svg`.
 *
 * Concept: a receipt with a zigzag bottom edge and a hryvnia symbol, on the
 * brand gradient (#0B5443 → #16A37B). Brand rules: never recolor the green ₴,
 * keep the zigzag receipt edge, use the `simple` mark below 48px. The gradient
 * tile is self-contained, so one icon works on both light and dark surfaces.
 */

const SANS = 'system-ui, -apple-system, sans-serif';
const BRAND = '#0F6E56';
const GRAD_FROM = '#0B5443';
const GRAD_TO = '#16A37B';
const WHITE = '#ffffff';

// Receipt body with an 8-tooth zigzag bottom, in the 80×80 icon viewBox.
const RECEIPT =
  'M23 15 h34 v50 l-4.25 -3 l-4.25 3 l-4.25 -3 l-4.25 3 l-4.25 -3 l-4.25 3 l-4.25 -3 l-4.25 3 z';

interface IconProps {
  size?: number;
  /** Accepted for backwards-compat; the gradient tile is one design for all surfaces. */
  theme?: 'dark' | 'light';
  /** Simplified mark (no top lines, bolder ₴) — use at ≤48px. */
  simple?: boolean;
}

/** Square app mark (receipt + hryvnia) on the brand gradient. */
export function LogoIcon({ size = 44, simple = false }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Coino">
      <defs>
        <linearGradient id="rcptIconG" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={GRAD_FROM} />
          <stop offset="1" stopColor={GRAD_TO} />
        </linearGradient>
      </defs>
      <rect width={80} height={80} rx={18} fill="url(#rcptIconG)" />
      <path d={RECEIPT} fill={WHITE} />
      {!simple && (
        <>
          <line x1={29} y1={24} x2={51} y2={24} stroke={BRAND} strokeWidth={2.2} strokeLinecap="round" opacity={0.22} />
          <line x1={29} y1={30} x2={45} y2={30} stroke={BRAND} strokeWidth={2.2} strokeLinecap="round" opacity={0.22} />
        </>
      )}
      <text
        x={40}
        y={52}
        textAnchor="middle"
        fontSize={simple ? 34 : 30}
        fontWeight={simple ? 700 : 600}
        fill={BRAND}
        fontFamily={SANS}
      >
        ₴
      </text>
    </svg>
  );
}

interface WordmarkProps {
  /** Rendered height in px; width scales to the source aspect ratio. */
  height?: number;
}

/** Horizontal wordmark (compact mark + "Coino"). */
export function Wordmark({ height = 32 }: WordmarkProps) {
  const width = (height * 168) / 32;
  return (
    <svg width={width} height={height} viewBox="0 0 168 32" role="img" aria-label="Coino">
      <defs>
        <linearGradient id="rcptWmcG" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={GRAD_FROM} />
          <stop offset="1" stopColor={GRAD_TO} />
        </linearGradient>
      </defs>
      <rect width={32} height={32} rx={7} fill="url(#rcptWmcG)" />
      <path
        d="M9 6 h14 v20 l-1.75 -1.25 l-1.75 1.25 l-1.75 -1.25 l-1.75 1.25 l-1.75 -1.25 l-1.75 1.25 l-1.75 -1.25 l-1.75 1.25 z"
        fill={WHITE}
      />
      <text x={16} y={21} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={BRAND} fontFamily={SANS}>
        ₴
      </text>
      <text x={42} y={22} fontSize={16} fontWeight={500} fill="#1a1a1a" fontFamily={SANS} letterSpacing={-0.3}>
        Coino
      </text>
    </svg>
  );
}
