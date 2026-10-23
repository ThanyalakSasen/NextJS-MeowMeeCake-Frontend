// ─────────────────────────────────────────────────────────────
// recipeForm.ts — pure: ค่าฟอร์มสูตรหลัก (field ธรรมดา — components/ingredients/steps เป็น local
// state แยกใน MainRecipeModal เอง เพราะเป็น array ที่ต้อง denormalize ชื่อ ไม่ใช่ scalar field)
// ─────────────────────────────────────────────────────────────
import type { Recipe } from "@/types/recipe";

export interface RecipeFormValue {
  recipe_name: string;
  product_id: string;
  yield_qty: number;
  yield_unit_id: string;
  /** null = ว่าง → ไม่ส่งไป ให้ backend คำนวณจากวัตถุดิบ (ค่าเริ่ม 0 เดิมทำให้ต้นทุนเป็น ฿0 เสมอ — TC-ADM-84) */
  estimated_cost_per_batch: number | null;
  duration_minutes: number;
  note?: string;
}

export const emptyRecipeForm: RecipeFormValue = {
  recipe_name: "",
  product_id: "",
  yield_qty: 1,
  yield_unit_id: "",
  estimated_cost_per_batch: null,
  duration_minutes: 0,
};

/** Recipe (จาก API) → ค่าเริ่มต้นของฟอร์มตอนแก้ไข */
export function fromRecipe(r: Recipe): RecipeFormValue {
  return {
    recipe_name: r.recipe_name,
    product_id: r.product_id,
    yield_qty: r.yield_qty,
    yield_unit_id: r.yield_unit_id,
    estimated_cost_per_batch: r.estimated_cost_per_batch,
    duration_minutes: r.duration_minutes,
    note: r.note ?? undefined,
  };
}
