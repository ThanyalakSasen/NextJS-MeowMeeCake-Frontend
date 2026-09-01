// เรียก endpoint /ingredients (docs/API_CONTRACT.md §3) — แพทเทิร์นเดียวกับ services/products.ts
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { Ingredient, IngredientInput, IngredientListParams } from "@/types/ingredient";

const BASE = "/ingredients";

export const ingredientsService = {
  list: (params: IngredientListParams = {}) => http.get<ListResponse<Ingredient>>(BASE, { params }),
  get: (id: string) => http.get<ItemResponse<Ingredient>>(`${BASE}/${id}`),
  create: (body: IngredientInput) => http.post<ItemResponse<Ingredient>>(BASE, body),
  update: (id: string, body: Partial<IngredientInput>) => http.patch<ItemResponse<Ingredient>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
