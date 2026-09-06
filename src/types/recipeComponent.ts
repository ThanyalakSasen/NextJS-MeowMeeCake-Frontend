// ─────────────────────────────────────────────────────────────
// src/types/recipeComponent.ts
// DTO ของ resource /components (docs/API_CONTRACT.md §3) — "สูตรส่วนประกอบ" (sub-recipe) นำไปใช้ซ้ำ
// ได้ในหลายสูตรหลัก (ผ่าน Recipe.components[])
//
// **หมวดหมู่ (`category`) เป็น fixed enum ค่าไทย** (`RecipeCategory` ใน enumConfig.ts) — ไม่ใช่
// resource `/component-categories` แยกแบบระบบเดิม (ดูเหตุผลเดียวกับ `AttendanceStatus` — แนวทาง A)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { RecipeCategory } from "@/constants/enumConfig";
import type { RecipeIngredientLine, RecipeStep } from "@/types/recipeShared";

export interface RecipeComponent {
  _id: string;
  component_name: string;
  category: RecipeCategory;
  ingredients: RecipeIngredientLine[];
  steps: RecipeStep[];
  yield_qty: number;
  yield_unit_id: string;
  yield_unit_abbr: string;
  estimated_cost_per_batch: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export type RecipeComponentInput = Omit<RecipeComponent, "_id" | "created_at" | "updated_at">;

export interface RecipeComponentListParams extends ListParams {
  category?: RecipeCategory;
}
