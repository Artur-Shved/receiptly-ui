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
  getAll: (page = 1, limit = 20): Promise<ReceiptsListResponse> =>
    apiClient.get<ReceiptsListResponse>(`/receipts?page=${page}&limit=${limit}`),
  getOne: (id: string): Promise<Receipt> =>
    apiClient.get<Receipt>(`/receipts/${id}`),
  create: (dto: CreateReceiptDto): Promise<Receipt> =>
    apiClient.post<Receipt>('/receipts', dto),
  update: (id: string, dto: UpdateReceiptDto): Promise<Receipt> =>
    apiClient.patch<Receipt>(`/receipts/${id}`, dto),
  remove: (id: string): Promise<void> =>
    apiClient.delete(`/receipts/${id}`),
};
