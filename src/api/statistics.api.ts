import { apiClient } from './client';
import type {
  StatisticsFilters,
  SummaryResponse,
  BreakdownResponse,
  TimelineResponse,
} from '@/src/types/statistics.types';

function buildQuery(filters: StatisticsFilters): string {
  const params = new URLSearchParams();
  params.set('dateFrom', filters.dateFrom);
  params.set('dateTo', filters.dateTo);
  for (const id of filters.storeId ?? []) params.append('storeId[]', id);
  for (const id of filters.transactionCategoryId ?? [])
    params.append('transactionCategoryId[]', id);
  for (const id of filters.itemCategoryId ?? []) params.append('itemCategoryId[]', id);
  return params.toString();
}

export const statisticsApi = {
  getSummary: (filters: StatisticsFilters): Promise<SummaryResponse> =>
    apiClient.get<SummaryResponse>(`/statistics/summary?${buildQuery(filters)}`),

  getByTransactionCategory: (filters: StatisticsFilters): Promise<BreakdownResponse> =>
    apiClient.get<BreakdownResponse>(
      `/statistics/by-transaction-category?${buildQuery(filters)}`,
    ),

  getByStore: (filters: StatisticsFilters): Promise<BreakdownResponse> =>
    apiClient.get<BreakdownResponse>(`/statistics/by-store?${buildQuery(filters)}`),

  getByItemCategory: (filters: StatisticsFilters): Promise<BreakdownResponse> =>
    apiClient.get<BreakdownResponse>(
      `/statistics/by-item-category?${buildQuery(filters)}`,
    ),

  getTimeline: (filters: StatisticsFilters): Promise<TimelineResponse> =>
    apiClient.get<TimelineResponse>(`/statistics/timeline?${buildQuery(filters)}`),
};
