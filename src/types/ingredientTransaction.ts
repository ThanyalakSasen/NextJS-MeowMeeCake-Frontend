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
  /** วันที่รับเข้า/เบิกใช้/นับจริง (แยกจาก created_at — บันทึกย้อนหลังได้) · ข้อมูลเก่าอาจเป็น null */
  transaction_date?: string | null;
  /** วันหมดอายุของล็อตที่รับเข้า (type "receive") */
  expiry_date?: string | null;
  performed_by?: string | { _id: string; user_fullname: string; email: string };
  /** เลขที่บิล/ใบสั่งซื้อ (ถ้ามี) */
  po_ref?: string | null;
  /** บิลซื้อ (ค่าใช้จ่าย) ที่รายการรับเข้านี้มาจาก — list populate เป็น object · null = ยังไม่ผูก */
  expense_id?: string | { _id: string; description: string; date: string; vendor?: string; amount: number } | null;
  /** ราคารวมของรายการนี้ในบิล (บาท) — มีเมื่อผูกบิลแล้ว */
  line_total?: number | null;
  created_at: string;
  updated_at: string;
}

/** body ตอน create — ref field ต้องเป็น string id */
export type IngredientTransactionInput = Omit<
  IngredientTransaction,
  "_id" | "created_at" | "updated_at" | "ingredient_id" | "unit_id" | "performed_by" | "expense_id" | "line_total"
> & {
  ingredient_id: string;
  unit_id?: string;
  performed_by?: string;
};

export interface IngredientTransactionListParams extends ListParams {
  ingredient_id?: string;
  type?: IngredientTxnType;
  /** "none" = เฉพาะรายการที่ยังไม่ผูกบิลซื้อ */
  expense_id?: string;
  /** ISO — กรองตามวันที่ทำรายการ (transaction_date) รวมขอบ */
  date_from?: string;
  date_to?: string;
}
