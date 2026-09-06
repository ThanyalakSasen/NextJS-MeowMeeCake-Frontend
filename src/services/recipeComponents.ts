// ─────────────────────────────────────────────────────────────
// src/services/recipeComponents.ts
// เรียก endpoint /components (สูตรส่วนประกอบ) — แพทเทิร์นเดียวกับ services/products.ts
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { RecipeComponent, RecipeComponentInput, RecipeComponentListParams } from "@/types/recipeComponent";

const BASE = "/components";

export const recipeComponentsService = {
  list: (params: RecipeComponentListParams = {}) =>
    http.get<ListResponse<RecipeComponent>>(BASE, { params }),

  get: (id: string) =>
    http.get<ItemResponse<RecipeComponent>>(`${BASE}/${id}`),

  create: (body: RecipeComponentInput) =>
    http.post<ItemResponse<RecipeComponent>>(BASE, body),

  update: (id: string, body: Partial<RecipeComponentInput>) =>
    http.patch<ItemResponse<RecipeComponent>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),
};
