import { apiClient } from './client';
import type {
  Receipt,
  ReceiptsListResponse,
  CreateReceiptDto,
  UpdateReceiptDto,
  ParsedReceiptDto,
} from '@/src/types/receipt.types';

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
  getAll: (
    page = 1,
    limit = 20,
    params?: { dateFrom?: string; dateTo?: string },
  ): Promise<ReceiptsListResponse> => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
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
