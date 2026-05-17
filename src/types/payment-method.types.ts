export enum PaymentMethodType {
  CARD = 'card',
  CASH = 'cash',
  DIGITAL = 'digital',
  OTHER = 'other',
}

export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  [PaymentMethodType.CARD]: 'Картка',
  [PaymentMethodType.CASH]: 'Готівка',
  [PaymentMethodType.DIGITAL]: 'Цифровий',
  [PaymentMethodType.OTHER]: 'Інше',
};

export interface PaymentMethod {
  id: string;
  userId: string;
  name: string;
  type: PaymentMethodType;
}

export interface CreatePaymentMethodDto {
  name: string;
  type: PaymentMethodType;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  type?: PaymentMethodType;
}
