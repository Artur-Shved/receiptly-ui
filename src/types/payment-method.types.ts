export interface PaymentMethod {
  id: string;
  userId: string;
  name: string;
}

export interface CreatePaymentMethodDto {
  name: string;
}

export interface UpdatePaymentMethodDto {
  name?: string;
}
