'use client';

import { useRouter } from 'next/navigation';
import { Camera, Pencil, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function AddReceiptChoiceModal({ onClose }: Props) {
  const router = useRouter();

  const handlePhoto = () => {
    onClose();
    router.push('/receipts/upload');
  };

  const handleManual = () => {
    onClose();
    router.push('/receipts/upload/manual');
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
            <button
              type="button"
              onClick={handlePhoto}
              className="flex flex-col items-start gap-2 rounded-lg border border-[#1a1a1a] bg-white p-4 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]"
            >
              <div
                className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#E1F5EE', color: '#0F6E56' }}
              >
                <Camera size={20} />
              </div>
              <p className="text-[14px] font-medium text-[#1a1a1a]">Сфотографувати чек</p>
              <p className="text-[12px] text-gray-500">LLM розпізнає товари автоматично</p>
              <span className="mt-1 text-[13px] font-medium" style={{ color: '#0F6E56' }}>
                Почати →
              </span>
            </button>

            <button
              type="button"
              onClick={handleManual}
              className="flex flex-col items-start gap-2 rounded-lg border border-[#e5e7eb] bg-white p-4 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#9ca3af]"
            >
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7F7F7] text-[#6b7280]">
                <Pencil size={20} />
              </div>
              <p className="text-[14px] font-medium text-[#1a1a1a]">Ввести вручну</p>
              <p className="text-[12px] text-gray-500">Без фото, товари вводяться самостійно</p>
              <span className="mt-1 text-[13px] font-medium text-[#6b7280]">Почати →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
