// ─────────────────────────────────────────────────────────────
// src/types/ingredient.ts — DTO ของ resource /ingredients (docs/API_CONTRACT.md §3)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";

// backend populate ingredient_category_id/unit_id เป็น object เต็มตอน GET/list — ใช้ refId() ดึง id
export interface Ingredient {
  _id: string;
  ingredient_name: string;
  ingredient_category_id?: string | { _id: string; ingredient_category_name: string };
  unit_id?: string | { _id: string; unit_name: string; unit_abbr: string };
  /** สต็อกคงเหลือปัจจุบัน */
  current_stock: number;
  /** จุดสั่งซื้อ — ต่ำกว่านี้ = "ใกล้หมด" */
  reorder_point: number;
  /** ปริมาณเต็มคลัง — ใช้คิด % ของ progress bar (ไม่มี = คำนวณจาก reorder_point) */
  max_stock?: number | null;
  cost_per_unit: number;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

/** body ตอน create/update — ingredient_category_id/unit_id ต้องเป็น string id เท่านั้น */
export type IngredientInput = Omit<
  Ingredient,
  "_id" | "created_at" | "updated_at" | "ingredient_category_id" | "unit_id"
> & {
  ingredient_category_id?: string;
  unit_id?: string;
};

export interface IngredientListParams extends ListParams {
  ingredient_category_id?: string;
}
