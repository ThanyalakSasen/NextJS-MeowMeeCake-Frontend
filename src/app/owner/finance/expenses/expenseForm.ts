// ─────────────────────────────────────────────────────────────
// expenseForm.ts — pure: ค่าฟอร์มรายการค่าใช้จ่าย (ใช้ทั้ง add/edit — แพทเทิร์นเดียวกับ bannerForm.ts)
// วันที่: ในฟอร์มเก็บเป็น Dayjs (antd DatePicker) · แปลงเป็น ISO string ตอน toExpenseInput
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from "@/constants/enumConfig";
import type { ExpenseCategory, ExpensePaymentMethod } from "@/constants/enumConfig";
import type { Expense, ExpenseInput } from "@/types/expense";

export interface ExpenseFormValue {
  date: Dayjs;
  description: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: ExpensePaymentMethod;
  vendor?: string;
  note?: string;
  receipt_url?: string;
  is_recurring: boolean;
}

export const emptyExpenseForm: ExpenseFormValue = {
  date: dayjs(),
  description: "",
  category: EXPENSE_CATEGORIES[0],
  amount: 0,
  payment_method: EXPENSE_PAYMENT_METHODS[0],
  is_recurring: false,
};

/** Expense (จาก API) → ค่าเริ่มต้นของฟอร์มตอนแก้ไข */
export function fromExpense(e: Expense): ExpenseFormValue {
  return {
    date: dayjs(e.date),
    description: e.description,
    category: e.category,
    amount: e.amount,
    payment_method: e.payment_method,
    vendor: e.vendor,
    note: e.note,
    receipt_url: e.receipt_url ?? undefined,
    is_recurring: e.is_recurring,
  };
}

/** ค่าจากฟอร์ม → body ที่ส่งเข้า API */
export function toExpenseInput(v: ExpenseFormValue): ExpenseInput {
  return {
    date: v.date.toISOString(),
    description: v.description.trim(),
    category: v.category,
    amount: v.amount,
    payment_method: v.payment_method,
    vendor: v.vendor?.trim() || undefined,
    note: v.note?.trim() || undefined,
    receipt_url: v.receipt_url || null,
    is_recurring: v.is_recurring,
  };
}
