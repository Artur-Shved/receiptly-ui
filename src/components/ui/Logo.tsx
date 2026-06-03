/**
 * Receiptly brand logo for the web app — a faithful port of the mobile
 * `components/ui/logo.tsx` (react-native-svg) to plain DOM SVG. Source of
 * truth: `receiptly-mobile/assets/logo/*.svg`.
 *
 * Brand rules: never recolor the green coin, keep receipt/coin proportions,
 * use the `simple` mark below 48px.
 */

const SANS = 'system-ui, -apple-system, sans-serif';
const COIN = '#EAF3DE';
const COIN_RING = '#3B6D11';
const HRYVNIA = '#27500A';

interface IconProps {
  size?: number;
  /** 'dark' = black tile (use on light surfaces), 'light' = white tile (dark bg). */
  theme?: 'dark' | 'light';
  /** Simplified mark (no wave/ring, thicker strokes) — use at ≤48px. */
  simple?: boolean;
}

/** Square app mark (receipt + hryvnia coin). */
export function LogoIcon({ size = 44, theme = 'dark', simple = false }: IconProps) {
  const dark = theme === 'dark';
  const bg = dark ? '#1a1a1a' : '#ffffff';
  const fg = dark ? '#ffffff' : '#1a1a1a';
  const lineOpacity = dark ? 0.45 : 0.3;

  if (simple) {
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Receiptly">
        <rect width={80} height={80} rx={18} fill={bg} />
        <rect x={14} y={10} width={38} height={52} rx={5} fill="none" stroke={fg} strokeWidth={3} />
        <line x1={22} y1={33} x2={44} y2={33} stroke={fg} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        <line x1={22} y1={46} x2={40} y2={46} stroke={fg} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        <circle cx={57} cy={56} r={16} fill={COIN} />
        <text x={57} y={61} textAnchor="middle" fontSize={18} fontWeight={500} fill={HRYVNIA} fontFamily={SANS}>
          ₴
        </text>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Receiptly">
      <rect width={80} height={80} rx={18} fill={bg} />
      <rect x={15} y={10} width={36} height={50} rx={4.5} fill="none" stroke={fg} strokeWidth={2} />
      <rect x={15} y={10} width={36} height={13} rx={4.5} fill={fg} opacity={dark ? 0.1 : 0.07} />
      <line x1={22} y1={31} x2={44} y2={31} stroke={fg} strokeWidth={1.8} strokeLinecap="round" opacity={lineOpacity} />
      <line x1={22} y1={39} x2={40} y2={39} stroke={fg} strokeWidth={1.8} strokeLinecap="round" opacity={lineOpacity} />
      <line x1={22} y1={47} x2={43} y2={47} stroke={fg} strokeWidth={1.8} strokeLinecap="round" opacity={lineOpacity} />
      <line x1={22} y1={54} x2={37} y2={54} stroke={fg} strokeWidth={1.8} strokeLinecap="round" opacity={lineOpacity} />
      <path
        d="M15 61 Q18.5 57 22 61 Q25.5 65 29 61 Q32.5 57 36 61 Q39.5 65 43 61 Q46.5 57 50 61"
        fill="none"
        stroke={fg}
        strokeWidth={1.5}
        opacity={dark ? 0.3 : 0.2}
      />
      <circle cx={57} cy={56} r={16} fill={COIN} />
      <circle cx={57} cy={56} r={13} fill="none" stroke={COIN_RING} strokeWidth={1.5} opacity={0.35} />
      <text x={57} y={61} textAnchor="middle" fontSize={18} fontWeight={500} fill={HRYVNIA} fontFamily={SANS}>
        ₴
      </text>
    </svg>
  );
}

interface WordmarkProps {
  /** Rendered height in px; width scales to the source aspect ratio. */
  height?: number;
}

/** Horizontal wordmark (compact mark + "Receiptly"). */
export function Wordmark({ height = 32 }: WordmarkProps) {
  const width = (height * 168) / 32;
  return (
    <svg width={width} height={height} viewBox="0 0 168 32" role="img" aria-label="Receiptly">
      <rect width={32} height={32} rx={7} fill="#1a1a1a" />
      <rect x={6} y={4} width={14.4} height={20} rx={1.8} fill="none" stroke="#ffffff" strokeWidth={0.9} />
      <line x1={8.8} y1={12} x2={17.6} y2={12} stroke="#ffffff" strokeWidth={1} strokeLinecap="round" opacity={0.45} />
      <line x1={8.8} y1={16} x2={16} y2={16} stroke="#ffffff" strokeWidth={1} strokeLinecap="round" opacity={0.45} />
      <line x1={8.8} y1={20} x2={17.2} y2={20} stroke="#ffffff" strokeWidth={1} strokeLinecap="round" opacity={0.45} />
      <circle cx={22.8} cy={22.4} r={6.4} fill={COIN} />
      <text x={22.8} y={25.2} textAnchor="middle" fontSize={7.2} fontWeight={500} fill={HRYVNIA} fontFamily={SANS}>
        ₴
      </text>
      <text x={42} y={22} fontSize={16} fontWeight={500} fill="#1a1a1a" fontFamily={SANS} letterSpacing={-0.3}>
        Receiptly
      </text>
    </svg>
  );
}
