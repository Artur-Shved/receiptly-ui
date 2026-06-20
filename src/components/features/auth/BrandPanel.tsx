import { ScanLine, Tags, PieChart } from 'lucide-react';

const FEATURES = [
  { icon: ScanLine, text: 'Сканування чеків за секунди' },
  { icon: Tags, text: 'Автоматична категоризація товарів' },
  { icon: PieChart, text: 'Наочна аналітика витрат' },
];

/** White receipt + ₴ mark (mark-mono) for use on the gradient panel. */
function MarkWhite({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Receiptly">
      <path
        d="M23 15 h34 v50 l-4.25 -3 l-4.25 3 l-4.25 -3 l-4.25 3 l-4.25 -3 l-4.25 3 l-4.25 -3 l-4.25 3 z"
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <text x="40" y="52" textAnchor="middle" fontSize={30} fontWeight={700} fill="#ffffff" fontFamily="system-ui, -apple-system, sans-serif">
        ₴
      </text>
    </svg>
  );
}

export function BrandPanel() {
  return (
    <div
      className="relative hidden min-h-screen w-full flex-col justify-center overflow-hidden px-16 md:flex"
      style={{ backgroundImage: 'var(--brand-gradient)', backgroundColor: '#0B5443' }}
    >
      {/* Soft decorative glows */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />

      <div className="relative">
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-[56px] w-[56px] items-center justify-center rounded-[16px] backdrop-blur"
            style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <MarkWhite size={30} />
          </div>
          <span className="text-[30px] font-semibold tracking-tight text-white">Receiptly</span>
        </div>

        <h2 className="mb-3 max-w-[420px] text-[34px] font-semibold leading-tight text-white">
          Контроль витрат починається з чека
        </h2>
        <p className="mb-10 max-w-[360px] text-[16px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
          Сфотографуйте чек — Receiptly розпізнає товари, розкладе по категоріях і покаже, куди йдуть гроші.
        </p>

        <ul className="flex flex-col gap-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.14)' }}
              >
                <Icon size={18} color="white" />
              </span>
              <span className="text-[15px]" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
