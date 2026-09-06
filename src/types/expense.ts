// ─────────────────────────────────────────────────────────────
// src/types/expense.ts
// DTO ของ resource /expenses (docs/API_CONTRACT.md §3) — ใช้ที่ Finance Expenses + Finance P&L (OPEX/COGS)
// `category`/`payment_method` เป็น fixed enum ค่าไทย (แนวทาง A — เหมือน AttendanceStatus/RecipeCategory)
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
  created_at: string;
  updated_at: string;
}

export type ExpenseInput = Omit<Expense, "_id" | "created_at" | "updated_at">;

export interface ExpenseListParams extends ListParams {
  category?: ExpenseCategory;
  is_recurring?: boolean;
}
