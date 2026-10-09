// ─────────────────────────────────────────────────────────────
// src/services/expenses.ts
// เรียก endpoint /expenses — แพทเทิร์นเดียวกับ services/products.ts
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Expense, ExpenseInput, ExpenseListParams } from "@/types/expense";

const BASE = "/admin/expenses";

export const expensesService = {
  list: (params: ExpenseListParams = {}) =>
    http.getList<Expense>(BASE, { params }),

  get: (id: string) =>
    http.get<ItemResponse<Expense>>(`${BASE}/${id}`),

  create: (body: ExpenseInput) =>
    http.post<ItemResponse<Expense>>(BASE, body),

  update: (id: string, body: Partial<ExpenseInput>) =>
    http.patch<ItemResponse<Expense>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),

  /**
   * POST /admin/expenses/receipts — อัปโหลดรูปใบเสร็จจริง (multipart · JPEG/PNG/WEBP/AVIF ≤ 5 MB · สิทธิ์ reports.create)
   * คืน URL ที่ต้องเอาไปใส่ receipt_url ตอน create/update — backend ไม่รับ base64 หรือลิงก์อื่น (ตอบ 400)
   */
  uploadReceipt: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await http.post<ItemResponse<{ url: string }>>(`${BASE}/receipts`, form);
    return res.data.url;
  },
};
