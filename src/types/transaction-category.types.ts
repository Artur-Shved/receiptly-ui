export interface TransactionCategory {
  id: string;
  userId: string | null;
  name: string;
}

export interface CreateTransactionCategoryDto {
  name: string;
}

export interface UpdateTransactionCategoryDto {
  name: string;
}
