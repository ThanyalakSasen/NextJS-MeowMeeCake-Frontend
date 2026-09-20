// ─────────────────────────────────────────────────────────────
// src/services/recipeComponents.ts — เรียก /admin/components (componentModel.ts จริงฝั่ง backend)
// map ที่นี่จุดเดียว: steps_content (JSON string) <-> steps (array) — เหมือน services/recipes.ts
// category_name/ingredient_name enrich ต่อที่ useRecipesViewModel.ts (join กับ list ที่โหลดแยกอยู่แล้ว)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { RecipeComponent, RecipeComponentInput, RecipeComponentListParams } from "@/types/recipeComponent";
import type { RecipeStep } from "@/types/recipeShared";
import { refId } from "@/lib/refId";

const BASE = "/admin/components";

/* eslint-disable @typescript-eslint/no-explicit-any */

function parseSteps(stepsContent: string | null | undefined): RecipeStep[] {
  if (!stepsContent) return [];
  try {
    const parsed = JSON.parse(stepsContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toComponent(raw: any): RecipeComponent {
  const yieldUnit = typeof raw.yield_unit_id === "string" ? null : raw.yield_unit_id;

  return {
    _id: raw._id,
    component_name: raw.component_name,
    componentcategory_id: refId(raw.componentcategory_id),
    category_name: "", // enrich ที่ ViewModel
    ingredients: (raw.ingredients ?? []).map((i: any) => ({
      ingredient_id: refId(i.ingredient_id),
      ingredient_name: "",
      quantity: i.quantity,
      unit_id: refId(i.unit_id),
      unit_abbr: "",
    })),
    steps: parseSteps(raw.steps_content),
    yield_qty: raw.yield_qty,
    yield_unit_id: refId(raw.yield_unit_id),
    yield_unit_abbr: yieldUnit?.unit_abbr ?? "",
    estimated_cost_per_batch: raw.estimated_cost_per_batch,
    note: raw.note ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function toBody(v: RecipeComponentInput | Partial<RecipeComponentInput>) {
  const { steps, ...rest } = v;
  return steps !== undefined ? { ...rest, steps_content: JSON.stringify(steps) } : rest;
}

export const recipeComponentsService = {
  list: async (params: RecipeComponentListParams = {}) => {
    const res = await http.getList<any>(BASE, { params });
    return { ...res, data: res.data.map(toComponent) };
  },

  get: async (id: string) => {
    const res = await http.get<ItemResponse<any>>(`${BASE}/${id}`);
    return { data: toComponent(res.data) };
  },

  create: async (body: RecipeComponentInput) => {
    const res = await http.post<ItemResponse<any>>(BASE, toBody(body));
    return { data: toComponent(res.data) };
  },

  update: async (id: string, body: Partial<RecipeComponentInput>) => {
    const res = await http.patch<ItemResponse<any>>(`${BASE}/${id}`, toBody(body));
    return { data: toComponent(res.data) };
  },

  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
