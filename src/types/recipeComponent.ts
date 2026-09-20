// ─────────────────────────────────────────────────────────────
// src/types/recipeComponent.ts
// DTO ของ resource /admin/components (componentModel.ts จริงฝั่ง backend) — "สูตรส่วนประกอบ"
// (sub-recipe) นำไปใช้ซ้ำได้ในหลายสูตรหลัก (ผ่าน Recipe.components[])
//
// componentcategory_id เป็น reference จริงไปยัง /admin/component-categories (ก่อนหน้านี้เคยลอง
// ใช้ fixed enum ภาษาไทยแทน แต่ backend บังคับเป็น ObjectId required — สร้างสูตรใหม่ผ่าน UI ไม่ผ่าน
// การตรวจสอบเลย จึงเปลี่ยนกลับมาอ้างอิง component-categories จริงแทน)
// backend ไม่ populate componentcategory_id ตอน list — enrich ชื่อที่ useRecipesViewModel.ts
// (join กับ component-categories ที่โหลดแยกอยู่แล้ว)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { RecipeIngredientLine, RecipeStep } from "@/types/recipeShared";

export interface RecipeComponent {
  _id: string;
  component_name: string;
  componentcategory_id: string;
  /** denormalize จาก componentcategory_id — enrich ที่ ViewModel (backend ไม่ populate ให้) */
  category_name: string;
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

/** body ตอน create/update จริง — steps เป็น array ที่นี่ (services/recipeComponents.ts stringify
 * ให้เป็น steps_content เอง) · ingredient ref backend บังคับมี unit_id เสมอ */
export interface RecipeComponentInput {
  component_name: string;
  componentcategory_id: string;
  ingredients: { ingredient_id: string; quantity: number; unit_id: string }[];
  steps: RecipeStep[];
  yield_qty: number;
  yield_unit_id: string;
  estimated_cost_per_batch: number;
  note?: string | null;
}

export interface RecipeComponentListParams extends ListParams {
  componentcategory_id?: string;
}
