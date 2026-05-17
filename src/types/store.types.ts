export interface Store {
  id: string;
  userId: string | null;
  name: string;
  createdAt: string;
}

export interface CreateStoreDto {
  name: string;
}

export interface UpdateStoreDto {
  name: string;
}

export interface DeleteStoreResponse {
  receiptsCount: number;
}
