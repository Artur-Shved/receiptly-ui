import { apiClient } from './client';
import type {
  Receipt,
  ReceiptsListResponse,
  CreateReceiptDto,
  UpdateReceiptDto,
  ParsedReceiptDto,
} from '@/src/types/receipt.types';

/** Query params for the paginated receipts list (all optional). */
export interface ReceiptListParams {
  page?: number;
  limit?: number;
  /** Case-insensitive substring match on store name (server-side). */
  storeName?: string;
  /** Inclusive YYYY-MM-DD bounds on receipt date. */
  dateFrom?: string;
  dateTo?: string;
  transactionCategoryIds?: string[];
  storeIds?: string[];
}

export const receiptsApi = {
  parse: (files: File[]): Promise<ParsedReceiptDto> => {
    const form = new FormData();
    for (const file of files) form.append('images', file);
    return apiClient.post<ParsedReceiptDto>('/receipts/parse', form);
  },
  parseFromQrImage: (file: File): Promise<ParsedReceiptDto> => {
    const form = new FormData();
    form.append('image', file);
    return apiClient.post<ParsedReceiptDto>('/receipts/parse-from-qr-image', form);
  },
  getAll: (params: ReceiptListParams = {}): Promise<ReceiptsListResponse> => {
    const qs = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 5),
    });
    if (params.storeName) qs.set('storeName', params.storeName);
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo) qs.set('dateTo', params.dateTo);
    if (params.transactionCategoryIds?.length)
      qs.set('transactionCategoryIds', params.transactionCategoryIds.join(','));
    if (params.storeIds?.length)
      qs.set('storeIds', params.storeIds.join(','));
    return apiClient.get<ReceiptsListResponse>(`/receipts?${qs.toString()}`);
  },
  getOne: (id: string): Promise<Receipt> =>
    apiClient.get<Receipt>(`/receipts/${id}`),
  create: (dto: CreateReceiptDto): Promise<Receipt> =>
    apiClient.post<Receipt>('/receipts', dto),
  update: (id: string, dto: UpdateReceiptDto): Promise<Receipt> =>
    apiClient.patch<Receipt>(`/receipts/${id}`, dto),
  remove: (id: string): Promise<void> =>
    apiClient.delete(`/receipts/${id}`),
};
