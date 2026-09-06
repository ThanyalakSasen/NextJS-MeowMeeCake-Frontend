// ─────────────────────────────────────────────────────────────
// src/types/recipe.ts
// DTO ของ resource /recipes (docs/API_CONTRACT.md §3) — "สูตรหลัก" ผูกกับสินค้า 1:1
// ระบบต้นทาง (-MeowMeeCake-NextJS5) เก็บ steps เป็น JSON string ใน `steps_content` — ที่นี่เก็บเป็น
// array ตรง ๆ (envelope คุยกันเป็น JSON อยู่แล้ว ไม่ต้อง stringify ซ้อน)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { ProductType } from "@/types/product";
import type { RecipeIngredientLine, RecipeStep } from "@/types/recipeShared";

/** สูตรส่วนประกอบที่ใช้ในสูตรหลัก — quantity = จำนวน batch ของ RecipeComponent นั้น */
export interface RecipeComponentRef {
  component_id: string;
  component_name: string;
  quantity: number;
}

export interface Recipe {
  _id: string;
  recipe_name: string;
  product_id: string;
  /** denormalize ไว้ตรง ๆ — โชว์การ์ด/ตารางโดยไม่ต้อง join */
  product_name: string;
  product_type: ProductType;
  components: RecipeComponentRef[];
  /** วัตถุดิบที่ใช้ตรง (ไม่ผ่านสูตรส่วนประกอบ) */
  ingredients: RecipeIngredientLine[];
  steps: RecipeStep[];
  yield_qty: number;
  yield_unit_id: string;
  yield_unit_abbr: string;
  estimated_cost_per_batch: number;
  duration_minutes: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export type RecipeInput = Omit<Recipe, "_id" | "created_at" | "updated_at">;

export interface RecipeListParams extends ListParams {
  product_id?: string;
}
