// ─────────────────────────────────────────────────────────────
// src/types/ingredientTransaction.ts
// DTO ของ /ingredient-transactions (docs/API_CONTRACT.md §3) — log การเคลื่อนไหวสต็อกวัตถุดิบ
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { IngredientTxnType } from "@/constants/enumConfig";

export interface IngredientTransaction {
  _id: string;
  ingredient_id: string;
  type: IngredientTxnType; // "use" | "receive" | "adjust"
  /** ขนาดการเปลี่ยนแปลง (ค่าบวกเสมอ — ทิศทางดูจาก type) */
  quantity: number;
  note?: string;
  /** ชื่อผู้ทำรายการ (mock เก็บชื่อตรง ๆ — ยังไม่มี users vertical) */
  performed_by?: string;
  created_at: string;
  updated_at: string;
}

export type IngredientTransactionInput = Omit<
  IngredientTransaction,
  "_id" | "created_at" | "updated_at"
>;

export interface IngredientTransactionListParams extends ListParams {
  ingredient_id?: string;
  type?: IngredientTxnType;
}
