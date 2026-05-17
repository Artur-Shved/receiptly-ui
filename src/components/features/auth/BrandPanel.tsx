import { Receipt } from 'lucide-react';

export function BrandPanel() {
  return (
    <div
      className="hidden md:flex min-h-screen w-full flex-col justify-center px-16"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px]"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <Receipt size={28} color="white" />
        </div>
        <span className="text-[28px] font-medium text-white">Receiptly</span>
      </div>
      <p
        className="max-w-[320px] text-base leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        Відстежуйте витрати через фото ваших чеків
      </p>
    </div>
  );
}
