export interface ItemCategory {
  id: string;
  userId: string | null;
  name: string;
}

export interface CreateItemCategoryDto {
  name: string;
}

export interface UpdateItemCategoryDto {
  name: string;
}

export interface RemoveItemCategoryResponse {
  itemsCount: number;
}
