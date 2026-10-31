// ─────────────────────────────────────────────────────────────
// src/types/purchase.ts
// บันทึกการซื้อวัตถุดิบ (POST /admin/purchases) = รับเข้าสต็อกทุกรายการ + ค่าใช้จ่าย 1 ใบ ผูกถึงกัน
// + รายการรับเข้าที่ผูกกับค่าใช้จ่าย (/admin/expenses/:id/stock-items) — backend services/purchaseService.ts
// ─────────────────────────────────────────────────────────────
import type { ExpensePaymentMethod } from "@/constants/enumConfig";
import type { Expense } from "@/types/expense";
import type { IngredientTransaction } from "@/types/ingredientTransaction";

/** หมวดค่าใช้จ่ายของบิลซื้อ — ของที่เข้าสต็อกวัตถุดิบ (เท่า backend schemas/purchase.ts) */
export const PURCHASE_CATEGORIES = ["วัตถุดิบ", "บรรจุภัณฑ์"] as const;
export type PurchaseCategory = (typeof PURCHASE_CATEGORIES)[number];
/** จำนวนรายการสูงสุดต่อบิล (เท่า backend PURCHASE_ITEMS_MAX) */
export const PURCHASE_ITEMS_MAX = 50;

export interface PurchaseItemInput {
  ingredient_id: string;
  qty: number;
  /** ราคารวมของรายการนี้ (บาทเต็ม) */
  line_total: number;
  /** ISO — วันหมดอายุของล็อตที่รับเข้า (ไม่บังคับ) */
  expiry_date?: string | null;
}

export interface PurchaseInput {
  /** ISO — วันที่ซื้อ/รับของ (ใช้เป็นวันที่ค่าใช้จ่ายและวันที่รับเข้า) */
  date: string;
  vendor?: string;
  category: PurchaseCategory;
  payment_method: ExpensePaymentMethod;
  /** ว่าง = backend ตั้งให้จากชื่อวัตถุดิบ */
  description?: string;
  note?: string;
  receipt_url?: string | null;
  /** เลขที่บิล — เก็บที่รายการรับเข้าทุกแถว */
  po_ref?: string;
  items: PurchaseItemInput[];
}

export interface PurchaseResult {
  expense: Expense;
  transactions: IngredientTransaction[];
}
