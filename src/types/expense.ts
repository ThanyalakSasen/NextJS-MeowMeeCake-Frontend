// ─────────────────────────────────────────────────────────────
// src/types/expense.ts
// DTO ของ resource /expenses (docs/API_CONTRACT.md §3) — ใช้ที่ Finance Expenses + Finance P&L (OPEX/COGS)
// `category`/`payment_method` เป็น fixed enum ค่าไทย (แนวทาง A — เหมือน RecipeCategory)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { ExpenseCategory, ExpensePaymentMethod } from "@/constants/enumConfig";

export interface Expense {
  _id: string;
  /** ISO date — วันที่จ่าย */
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: ExpensePaymentMethod;
  vendor?: string;
  note?: string;
  /** base64/URL ใบเสร็จที่แนบ — null/undefined = ยังไม่แนบ */
  receipt_url?: string | null;
  /** รายจ่ายประจำ (ค่าเช่า/ค่าไฟ ฯลฯ) — frontend คำนวณวันครบกำหนดรอบถัดไปจาก date + 1 เดือน */
  is_recurring: boolean;
  /** จำนวนรายการรับเข้าสต็อกวัตถุดิบที่ผูกกับค่าใช้จ่ายนี้ (บันทึกการซื้อ / ผูกย้อนหลัง) — backend คำนวณให้ */
  linked_count?: number;
  /** ราคารวมของรายการรับเข้าที่ผูกไว้ (บาท) — ยอดค่าใช้จ่ายต้องไม่น้อยกว่านี้ */
  linked_total?: number;
  created_at: string;
  updated_at: string;
}

export type ExpenseInput = Omit<Expense, "_id" | "created_at" | "updated_at" | "linked_count" | "linked_total">;

export interface ExpenseListParams extends ListParams {
  category?: ExpenseCategory;
  is_recurring?: boolean;
  /** ISO — กรองตาม date (วันที่จ่าย) ที่ backend · รวมขอบทั้งสองฝั่ง */
  date_from?: string;
  date_to?: string;
  sortBy?: "date" | "amount" | "created_at";
  sortOrder?: "asc" | "desc";
}

/** GET /admin/expenses/summary — ยอดรวมค่าใช้จ่ายตามหมวดในช่วงวันที่ (รวมที่ backend ไม่ติดเพดานจำนวนรายการ) */
export interface ExpenseSummary {
  total: number;
  count: number;
  by_category: { category: ExpenseCategory; total: number; count: number }[];
}
