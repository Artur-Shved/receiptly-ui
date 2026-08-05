'use client';

import { X, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { categoryColor } from '@/src/lib/category-colors';
import type { Receipt as ReceiptType } from '@/src/types/receipt.types';

/** Long Ukrainian date, e.g. "2 червня 2026 р." */
export function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ItemCategoryBadge({
  id,
  name,
}: {
  id?: string | null;
  name: string | null | undefined;
}) {
  if (!name) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
      >
        Без кат.
      </span>
    );
  }
  if (!id) {
    return (
      <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[11px] text-[#6b7280]">
        {name}
      </span>
    );
  }
  const { bg, text } = categoryColor(id);
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {name}
    </span>
  );
}

interface ReceiptDetailsModalProps {
  receipt: ReceiptType;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Read-only receipt details (meta grid + items table + total) in a centered
 * modal. Shared by the receipts list and the home screen so a receipt opens
 * in place on either page instead of forcing a navigation.
 */
export function ReceiptDetailsModal({ receipt, onClose, onEdit, onDelete }: ReceiptDetailsModalProps) {
  const storeName = receipt.store?.name ?? '—';
  const paymentMethodName = receipt.paymentMethod?.name ?? '—';
  const categoryName = receipt.transactionCategory?.name ?? '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="flex w-[640px] max-w-full flex-col rounded-xl bg-white shadow-xl"
        style={{ maxHeight: 'calc(100vh - 32px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#e5e7eb] p-5">
          <div>
            <h2 className="text-[16px] font-medium text-[#1a1a1a]">{storeName} — {formatFullDate(receipt.receiptDate)}</h2>
            <p className="mt-0.5 text-[12px] text-[#9ca3af]">Чек #{receipt.id.slice(0, 8)}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#F7F7F7] hover:text-[#1a1a1a]">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Meta grid */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Магазин', value: storeName },
              { label: 'Дата покупки', value: formatFullDate(receipt.receiptDate) },
              { label: 'Метод оплати', value: paymentMethodName },
              { label: 'Категорія транзакції', value: categoryName },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg p-[10px_12px]" style={{ backgroundColor: '#F7F7F7' }}>
                <p className="text-[11px] uppercase tracking-wide text-[#9ca3af]">{label}</p>
                <p className="mt-0.5 text-[13px] font-medium text-[#1a1a1a]">{value}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          <p className="mb-3 text-[12px] uppercase tracking-wide text-[#9ca3af]">Товари</p>
          <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
            <div
              className="grid text-[11px] uppercase tracking-wide text-[#0F6E56]"
              style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 60px', padding: '8px 12px', backgroundColor: 'var(--brand-soft, #E1F5EE)' }}
            >
              <span>Назва</span><span>Кат.</span><span>К-сть</span><span>Ціна/од</span>
              <span className="text-right">Сума</span>
            </div>
            {(receipt.items ?? []).length === 0 && (
              <div className="px-4 py-4 text-center text-[13px] text-[#9ca3af]">Немає товарів</div>
            )}
            {(receipt.items ?? []).map((item) => (
              <div
                key={item.id}
                className="grid border-t border-[#e5e7eb]"
                style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 60px', padding: '8px 12px' }}
              >
                <span className="text-[13px] text-[#1a1a1a]">{item.name}</span>
                <span><ItemCategoryBadge id={item.itemCategory?.id} name={item.itemCategory?.name} /></span>
                <span className="text-[13px] text-[#6b7280]">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                <span className="text-[13px] text-[#6b7280]">{item.pricePerUnit} {receipt.currency}</span>
                <span className="text-right text-[13px] text-[#1a1a1a]">
                  {item.discountAmount > 0 ? (
                    <span className="flex flex-col items-end leading-tight">
                      <span className="text-[11px] text-[#9ca3af] line-through">{item.originalAmount} {receipt.currency}</span>
                      <span className="text-[11px]" style={{ color: '#A32D2D' }}>−{item.discountAmount} {receipt.currency}</span>
                      <span className="font-medium">{item.totalPrice} {receipt.currency}</span>
                    </span>
                  ) : (
                    <>{item.totalPrice} {receipt.currency}</>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-end gap-4 border-t border-[#e5e7eb] pt-3">
            <span className="text-[13px] text-[#6b7280]">Загальна сума</span>
            <span className="text-[18px] font-medium">{receipt.totalAmount} {receipt.currency}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-[#e5e7eb] p-5">
          <Button variant="danger" fullWidth={false} icon={<Trash2 size={14} />} className="py-2 px-[14px] text-[13px]" onClick={onDelete}>
            Видалити
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth={false} icon={<Pencil size={14} />} className="py-2 px-[14px] text-[13px]" onClick={onEdit}>
              Редагувати
            </Button>
            <Button fullWidth={false} className="py-2 px-[14px] text-[13px]" onClick={onClose}>
              Закрити
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
