// ─────────────────────────────────────────────────────────────
// src/services/recipes.ts
// เรียก endpoint /recipes (สูตรหลัก) — แพทเทิร์นเดียวกับ services/products.ts
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { Recipe, RecipeInput, RecipeListParams } from "@/types/recipe";

const BASE = "/recipes";

export const recipesService = {
  list: (params: RecipeListParams = {}) =>
    http.get<ListResponse<Recipe>>(BASE, { params }),

  get: (id: string) =>
    http.get<ItemResponse<Recipe>>(`${BASE}/${id}`),

  create: (body: RecipeInput) =>
    http.post<ItemResponse<Recipe>>(BASE, body),

  update: (id: string, body: Partial<RecipeInput>) =>
    http.patch<ItemResponse<Recipe>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),
};
