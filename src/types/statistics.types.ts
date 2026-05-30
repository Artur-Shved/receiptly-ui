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
