export interface StatisticsFilters {
  dateFrom: string;
  dateTo: string;
  storeId?: string[];
  transactionCategoryId?: string[];
  itemCategoryId?: string[];
}

export interface SummaryPeriod {
  totalAmount: number;
  receiptsCount: number;
  avgAmount: number;
}

export interface SummaryResponse extends SummaryPeriod {
  dateFrom: string;
  dateTo: string;
  previous: SummaryPeriod;
}

export interface BreakdownItem {
  id: string | null;
  name: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface BreakdownResponse {
  items: BreakdownItem[];
  totalAmount: number;
}

export type Granularity = 'day' | 'week' | 'month';

export interface TimelinePoint {
  period: string;
  totalAmount: number;
  receiptsCount: number;
}

export interface TimelineResponse {
  granularity: Granularity;
  points: TimelinePoint[];
}

export interface ReceiptDrillDownItem {
  id: string;
  receiptDate: string;
  totalAmount: number;
  storeName?: string | null;
  transactionCategoryName?: string | null;
}

export interface ItemDrillDownItem {
  name: string;
  storeName: string | null;
  quantity: number;
  unit: string | null;
  pricePerUnit: number;
  totalPrice: number;
  receiptDate: string;
}

export interface DrillDownResponse<T> {
  items: T[];
  total: number;
}
