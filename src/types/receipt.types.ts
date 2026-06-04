export interface ReceiptItem {
  id: string;
  receiptId: string;
  itemCategoryId: string | null;
  name: string;
  quantity: number;
  unit: string | null;
  pricePerUnit: number;
  /** Pre-discount line amount. */
  originalAmount: number;
  /** 0 when there is no discount on this line. */
  discountAmount: number;
  /** Server-computed: max(0, originalAmount - discountAmount). */
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
  /** Pre-discount line amount; what the user typed. */
  originalAmount: number;
  /** Optional discount on this line; 0 by default. Server computes the final total. */
  discountAmount?: number;
  itemCategoryId?: string | null;
  /**
   * LLM-proposed new category name. When set and `itemCategoryId` is null, the
   * server resolves/creates the category by normalized name on confirm.
   */
  suggestedCategoryName?: string | null;
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
  originalAmount: number;
  discountAmount: number;
  totalPrice: number;
  hasDiscount: boolean;
  /** Raw LLM category value — ignored by the client. */
  category: string | null;
  /** Existing (user/system) category id auto-assigned by the LLM, or null. */
  itemCategoryId: string | null;
  /** Proposed new category name when no existing one matched, or null. */
  suggestedCategoryName: string | null;
  /** True when `suggestedCategoryName` is set. */
  categoryIsNew: boolean;
  photoIndex?: number;
}

export interface PriceConflictEntry {
  photoIndex: number;
  pricePerUnit: number;
}

export interface PriceConflict {
  name: string;
  saved: PriceConflictEntry;
  removed: PriceConflictEntry;
}

export interface ParseMeta {
  photosTotal: number;
  photosSucceeded: number;
  photosFailed: number;
  duplicatesRemoved: number;
  hasPriceConflicts: boolean;
  failedIndices: number[];
  priceConflicts: PriceConflict[];
}

export interface ParsedReceiptDto {
  storeName: string | null;
  receiptDate: string | null;
  totalAmount: number | null;
  currency: string;
  items: ParsedItem[];
  parseConfidence: 'full' | 'partial' | 'failed';
  meta?: ParseMeta;
}
