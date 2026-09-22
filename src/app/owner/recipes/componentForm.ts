// ─────────────────────────────────────────────────────────────
// componentForm.ts — pure: ค่าฟอร์มสูตรส่วนประกอบ (field ธรรมดา — ingredients/steps เป็น local
// state แยกใน ComponentFormModal เอง เหมือน recipeForm.ts)
// componentcategory_id อ้างอิง /admin/component-categories จริง (ไม่ใช่ fixed enum อีกต่อไป)
// ─────────────────────────────────────────────────────────────
import type { RecipeComponent } from "@/types/recipeComponent";

export interface ComponentFormValue {
  component_name: string;
  componentcategory_id: string;
  yield_qty: number;
  yield_unit_id: string;
  estimated_cost_per_batch: number;
  note?: string;
}

export const emptyComponentForm: ComponentFormValue = {
  component_name: "",
  componentcategory_id: "",
  yield_qty: 1,
  yield_unit_id: "",
  estimated_cost_per_batch: 0,
};

/** RecipeComponent (จาก API) → ค่าเริ่มต้นของฟอร์มตอนแก้ไข */
export function fromComponent(c: RecipeComponent): ComponentFormValue {
  return {
    component_name: c.component_name,
    componentcategory_id: c.componentcategory_id,
    yield_qty: c.yield_qty,
    yield_unit_id: c.yield_unit_id,
    estimated_cost_per_batch: c.estimated_cost_per_batch,
    note: c.note ?? undefined,
  };
}
