// ─────────────────────────────────────────────────────────────
// src/types/recipeShared.ts
// รูปร่างที่ใช้ร่วมกันระหว่าง Recipe (สูตรหลัก) และ RecipeComponent (สูตรส่วนประกอบ)
// ─────────────────────────────────────────────────────────────

/** วัตถุดิบ 1 รายการในสูตร — denormalize ชื่อ/หน่วยไว้ตรง ๆ (แพทเทิร์นเดียวกับ ProductionOrderItem) */
export interface RecipeIngredientLine {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit_id: string;
  unit_abbr: string;
}

/** ขั้นตอนการทำ 1 ขั้น */
export interface RecipeStep {
  order: number;
  title: string;
  description: string;
  duration_minutes?: number | null;
}
