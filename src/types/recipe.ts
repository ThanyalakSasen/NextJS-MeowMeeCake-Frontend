// ─────────────────────────────────────────────────────────────
// src/types/recipe.ts — DTO ของ resource /admin/recipes (recipeModel.ts จริงฝั่ง backend)
//
// backend เก็บ steps เป็น JSON string ใน steps_content (parse/stringify ที่ services/recipes.ts
// จุดเดียว) · ไม่มี field product_type/yield_unit_abbr/ingredient_name/component_name บน backend
// เลย (populate แค่ product_id + yield_unit_id ตอน list — ไม่ populate ingredients/components ข้างใน)
// — product_name/yield_unit_abbr denormalize จาก populate ที่มีอยู่ได้ที่ services/recipes.ts
// ส่วน ingredient_name/unit_abbr/component_name ต้อง join กับ ingredients/units/components ที่โหลด
// แยกอยู่แล้วใน useRecipesViewModel.ts (ไม่เพิ่ม request ใหม่)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
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
  /** denormalize จาก product_id ที่ backend populate มาให้แล้ว (services/recipes.ts) */
  product_name: string;
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

/**
 * body ตอน create/update จริง — ต่างจาก Recipe: steps เป็น array ที่นี่ (services/recipes.ts
 * stringify ให้เป็น steps_content เอง) · component ref backend บังคับมี unit_id ด้วย (แม้ frontend
 * ไม่โชว์ก็ต้องแนบไป — ปกติ = yield_unit_id ของ component นั้น, ดู useRecipesViewModel.onSaveRecipe)
 */
export interface RecipeInput {
  recipe_name: string;
  product_id: string;
  components: { component_id: string; quantity: number; unit_id: string }[];
  ingredients: { ingredient_id: string; quantity: number; unit_id: string }[];
  steps: RecipeStep[];
  yield_qty: number;
  yield_unit_id: string;
  estimated_cost_per_batch: number;
  duration_minutes: number;
  note?: string | null;
}

export interface RecipeListParams extends ListParams {
  product_id?: string;
}
