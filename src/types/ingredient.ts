// ─────────────────────────────────────────────────────────────
// src/types/ingredient.ts — DTO ของ resource /ingredients (docs/API_CONTRACT.md §3)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";

export interface Ingredient {
  _id: string;
  ingredient_name: string;
  ingredient_category_id?: string;
  unit_id?: string;
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

export type IngredientInput = Omit<Ingredient, "_id" | "created_at" | "updated_at">;

export interface IngredientListParams extends ListParams {
  ingredient_category_id?: string;
}
