// ─────────────────────────────────────────────────────────────
// src/services/recipes.ts — เรียก /admin/recipes (recipeModel.ts จริงฝั่ง backend)
// map ที่นี่จุดเดียว: steps_content (JSON string) <-> steps (array), denormalize product_name/
// yield_unit_abbr จาก populate ที่ backend ให้มา — ingredient_name/component_name enrich ต่อที่
// useRecipesViewModel.ts (join กับ ingredients/components ที่โหลดแยกอยู่แล้ว ไม่ยิง request เพิ่ม)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Recipe, RecipeInput, RecipeListParams } from "@/types/recipe";
import type { RecipeStep } from "@/types/recipeShared";
import { refId } from "@/lib/refId";

const BASE = "/admin/recipes";

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

function toRecipe(raw: any): Recipe {
  const product = typeof raw.product_id === "string" ? null : raw.product_id;
  const yieldUnit = typeof raw.yield_unit_id === "string" ? null : raw.yield_unit_id;

  return {
    _id: raw._id,
    recipe_name: raw.recipe_name,
    product_id: refId(raw.product_id),
    product_name: product?.product_name_th ?? "",
    components: (raw.components ?? []).map((c: any) => ({
      component_id: refId(c.component_id),
      component_name: "", // enrich ที่ ViewModel (ไม่ populate มาจาก list())
      quantity: c.quantity,
    })),
    ingredients: (raw.ingredients ?? []).map((i: any) => ({
      ingredient_id: refId(i.ingredient_id),
      ingredient_name: "", // enrich ที่ ViewModel เช่นกัน
      quantity: i.quantity,
      unit_id: refId(i.unit_id),
      unit_abbr: "",
    })),
    steps: parseSteps(raw.steps_content),
    yield_qty: raw.yield_qty,
    yield_unit_id: refId(raw.yield_unit_id),
    yield_unit_abbr: yieldUnit?.unit_abbr ?? "",
    estimated_cost_per_batch: raw.estimated_cost_per_batch,
    duration_minutes: raw.duration_minutes ?? 0,
    note: raw.note ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function toBody(v: RecipeInput) {
  const { steps, ...rest } = v;
  return { ...rest, steps_content: JSON.stringify(steps) };
}

export const recipesService = {
  list: async (params: RecipeListParams = {}) => {
    const res = await http.getList<any>(BASE, { params });
    return { ...res, data: res.data.map(toRecipe) };
  },

  get: async (id: string) => {
    const res = await http.get<ItemResponse<any>>(`${BASE}/${id}`);
    return { data: toRecipe(res.data) };
  },

  create: async (body: RecipeInput) => {
    const res = await http.post<ItemResponse<any>>(BASE, toBody(body));
    return { data: toRecipe(res.data) };
  },

  update: async (id: string, body: Partial<RecipeInput>) => {
    const { steps, ...rest } = body;
    const payload = steps !== undefined ? { ...rest, steps_content: JSON.stringify(steps) } : rest;
    const res = await http.patch<ItemResponse<any>>(`${BASE}/${id}`, payload);
    return { data: toRecipe(res.data) };
  },

  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
