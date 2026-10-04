import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { IngredientCategory } from "@/types/ingredientCategory";

const BASE = "/admin/ingredient-categories";

// CRUD หมวดหมู่ — backend มีครบ (crudRoutes) · ชื่อห้ามซ้ำกับหมวดที่ยังไม่ถูกลบ (docs/BACKLOG2.md §15.2 ข้อ 1)
export const ingredientCategoriesService = {
  list: () => http.getList<IngredientCategory>(BASE, { params: { limit: 100 } }),
  create: (body: { ingredient_category_name: string }) => http.post<ItemResponse<IngredientCategory>>(BASE, body),
  update: (id: string, body: { ingredient_category_name: string }) => http.patch<ItemResponse<IngredientCategory>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
