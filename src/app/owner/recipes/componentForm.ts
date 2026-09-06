// ─────────────────────────────────────────────────────────────
// componentForm.ts — pure: ค่าฟอร์มสูตรส่วนประกอบ (field ธรรมดา — ingredients/steps เป็น local
// state แยกใน ComponentFormModal เอง เหมือน recipeForm.ts)
// ─────────────────────────────────────────────────────────────
import type { RecipeComponent } from "@/types/recipeComponent";
import { RECIPE_CATEGORIES } from "@/constants/enumConfig";
import type { RecipeCategory } from "@/constants/enumConfig";

export interface ComponentFormValue {
  component_name: string;
  category: RecipeCategory;
  yield_qty: number;
  yield_unit_id: string;
  estimated_cost_per_batch: number;
  note?: string;
}

export const emptyComponentForm: ComponentFormValue = {
  component_name: "",
  category: RECIPE_CATEGORIES[0],
  yield_qty: 1,
  yield_unit_id: "",
  estimated_cost_per_batch: 0,
};

/** RecipeComponent (จาก API) → ค่าเริ่มต้นของฟอร์มตอนแก้ไข */
export function fromComponent(c: RecipeComponent): ComponentFormValue {
  return {
    component_name: c.component_name,
    category: c.category,
    yield_qty: c.yield_qty,
    yield_unit_id: c.yield_unit_id,
    estimated_cost_per_batch: c.estimated_cost_per_batch,
    note: c.note ?? undefined,
  };
}
