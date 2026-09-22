// ─────────────────────────────────────────────────────────────
// src/types/ingredientTransaction.ts
// DTO ของ /ingredient-transactions (docs/API_CONTRACT.md §3) — log การเคลื่อนไหวสต็อกวัตถุดิบ
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { IngredientTxnType } from "@/constants/enumConfig";

// backend populate ingredient_id/unit_id/performed_by เป็น object เต็มตอน list (ingredientTransactionService.listTransactions)
export interface IngredientTransaction {
  _id: string;
  ingredient_id: string | { _id: string; ingredient_name: string };
  type: IngredientTxnType; // "use" | "receive" | "adjust"
  /** ขนาดการเปลี่ยนแปลง (ค่าบวกเสมอ — ทิศทางดูจาก type) — backend ใช้ชื่อ field "qty" ไม่ใช่ "quantity" */
  qty: number;
  unit_id?: string | { _id: string; unit_name: string; unit_abbr: string };
  note?: string;
  performed_by?: string | { _id: string; user_fullname: string; email: string };
  created_at: string;
  updated_at: string;
}

/** body ตอน create — ref field ต้องเป็น string id */
export type IngredientTransactionInput = Omit<
  IngredientTransaction,
  "_id" | "created_at" | "updated_at" | "ingredient_id" | "unit_id" | "performed_by"
> & {
  ingredient_id: string;
  unit_id?: string;
  performed_by?: string;
};

export interface IngredientTransactionListParams extends ListParams {
  ingredient_id?: string;
  type?: IngredientTxnType;
}
