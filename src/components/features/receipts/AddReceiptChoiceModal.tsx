'use client';

import { useRouter } from 'next/navigation';
import { Pencil, Upload, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

interface CardProps {
  onClick: () => void;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  ctaColor: string;
}

function ChoiceCard({ onClick, borderColor, iconBg, iconColor, icon, title, sub, ctaColor }: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-lg bg-white p-4 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#9ca3af]"
      style={{ border: `0.5px solid ${borderColor}` }}
    >
      <div
        className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <p className="text-[14px] font-medium text-[#1a1a1a]">{title}</p>
      <p className="text-[12px] text-gray-500">{sub}</p>
      <span className="mt-1 text-[12px] font-medium" style={{ color: ctaColor }}>
        Почати →
      </span>
    </button>
  );
}

export function AddReceiptChoiceModal({ onClose }: Props) {
  const router = useRouter();

  const handleNav = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-[560px] max-w-[calc(100%-32px)] rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5e7eb] p-5">
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Додати чек</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-3 text-[13px] text-gray-500">Оберіть спосіб додавання</p>

          <div className="grid grid-cols-2 gap-3">
            <ChoiceCard
              onClick={() => handleNav('/receipts/upload')}
              borderColor="#1a1a1a"
              iconBg="#E1F5EE"
              iconColor="#0F6E56"
              icon={<Upload size={20} />}
              title="Завантажити чек"
              sub="Фото або PDF чека — товари розпізнаються автоматично"
              ctaColor="#0F6E56"
            />
            <ChoiceCard
              onClick={() => handleNav('/receipts/upload/manual')}
              borderColor="#e5e7eb"
              iconBg="#F7F7F7"
              iconColor="#6b7280"
              icon={<Pencil size={20} />}
              title="Ввести вручну"
              sub="Без фото, товари вводяться самостійно"
              ctaColor="#6b7280"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
