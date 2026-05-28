export interface ReceiptItem {
  id: string;
  receiptId: string;
  itemCategoryId: string | null;
  name: string;
  quantity: number;
  unit: string | null;
  pricePerUnit: number;
  totalPrice: number;
  itemCategory?: { id: string; name: string } | null;
}

export interface Receipt {
  id: string;
  userId: string;
  storeId: string | null;
  paymentMethodId: string | null;
  transactionCategoryId: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  receiptDate: string;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string } | null;
  paymentMethod?: { id: string; name: string } | null;
  transactionCategory?: { id: string; name: string } | null;
  items?: ReceiptItem[];
}

export interface ReceiptsListResponse {
  data: Receipt[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateReceiptItemDto {
  name: string;
  quantity: number;
  unit?: string;
  pricePerUnit: number;
  totalPrice: number;
  itemCategoryId?: string | null;
}

export interface CreateReceiptDto {
  storeId?: string | null;
  paymentMethodId?: string | null;
  transactionCategoryId?: string | null;
  receiptDate: string;
  currency?: string;
  items: CreateReceiptItemDto[];
}

export interface UpdateReceiptDto {
  storeId?: string | null;
  paymentMethodId?: string | null;
  transactionCategoryId?: string | null;
  receiptDate?: string;
  currency?: string;
  items?: CreateReceiptItemDto[];
}

export interface ParsedItem {
  name: string;
  quantity: number;
  unit: string | null;
  pricePerUnit: number;
  totalPrice: number;
  category: string | null;
}

export interface ParsedReceiptDto {
  storeName: string | null;
  receiptDate: string | null;
  totalAmount: number | null;
  currency: string;
  items: ParsedItem[];
  parseConfidence: 'full' | 'partial' | 'failed';
}
