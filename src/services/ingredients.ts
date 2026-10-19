// เรียก endpoint /ingredients (docs/API_CONTRACT.md §3) — แพทเทิร์นเดียวกับ services/products.ts
import { http, type HttpReader } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Ingredient, IngredientInput, IngredientListParams } from "@/types/ingredient";

const BASE = "/admin/ingredients";

export const ingredientsService = {
  /** h = http client (ค่าเริ่มต้น http ปกติ) — ฝั่ง server ส่ง withConfig(cookie + no-store) เข้ามา (page.tsx ของหน้าวัตถุดิบ) */
  list: (params: IngredientListParams = {}, h: HttpReader = http) => h.getList<Ingredient>(BASE, { params }),
  get: (id: string) => http.get<ItemResponse<Ingredient>>(`${BASE}/${id}`),
  create: (body: IngredientInput) => http.post<ItemResponse<Ingredient>>(BASE, body),
  update: (id: string, body: Partial<IngredientInput>) => http.patch<ItemResponse<Ingredient>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
