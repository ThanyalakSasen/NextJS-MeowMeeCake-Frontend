// ─────────────────────────────────────────────────────────────
// src/services/expenses.ts
// เรียก endpoint /expenses — แพทเทิร์นเดียวกับ services/products.ts
// ─────────────────────────────────────────────────────────────
import { http, type HttpReader } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Expense, ExpenseInput, ExpenseListParams, ExpenseSummary } from "@/types/expense";
import type { IngredientTransaction } from "@/types/ingredientTransaction";

const BASE = "/admin/expenses";

export const expensesService = {
  list: (params: ExpenseListParams = {}, h: HttpReader = http) =>
    h.getList<Expense>(BASE, { params }),

  /** ยอดรวมตามหมวดในช่วงวันที่ — หน้าสรุปการเงินใช้แทนการโหลดทุกรายการมารวมเอง */
  summary: async (params: { date_from?: string; date_to?: string } = {}, h: HttpReader = http): Promise<ExpenseSummary> =>
    (await h.get<ItemResponse<ExpenseSummary>>(`${BASE}/summary`, { params })).data,

  get: (id: string) =>
    http.get<ItemResponse<Expense>>(`${BASE}/${id}`),

  create: (body: ExpenseInput) =>
    http.post<ItemResponse<Expense>>(BASE, body),

  update: (id: string, body: Partial<ExpenseInput>) =>
    http.patch<ItemResponse<Expense>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),

  /** รายการรับเข้าสต็อกวัตถุดิบที่ผูกกับค่าใช้จ่ายนี้ (populate วัตถุดิบ/หน่วย) */
  stockItems: async (id: string): Promise<IngredientTransaction[]> =>
    (await http.get<ItemResponse<IngredientTransaction[]>>(`${BASE}/${id}/stock-items`)).data,

  /** ผูกรายการรับเข้าเดิมย้อนหลัง — ราคารวมของที่ผูกทั้งหมดต้องไม่เกินยอดค่าใช้จ่าย (backend ตรวจ) */
  linkStockItems: (id: string, links: { transaction_id: string; line_total: number }[]) =>
    http.post<ItemResponse<{ linked: number }>>(`${BASE}/${id}/stock-items`, { links }),

  /** ยกเลิกการผูก (สต็อกไม่เปลี่ยน) */
  unlinkStockItem: (id: string, transactionId: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}/stock-items/${transactionId}`),

  /**
   * POST /admin/expenses/receipts — อัปโหลดรูปใบเสร็จจริง (multipart · JPEG/PNG/WEBP/AVIF ≤ 5 MB · สิทธิ์ reports.create)
   * คืน URL ที่ต้องเอาไปใส่ receipt_url ตอน create/update — backend ไม่รับ base64 หรือลิงก์อื่น (ตอบ 400)
   * ใบเสร็จเป็นไฟล์ส่วนตัว: URL เป็น "/api/files/receipts/<ไฟล์>" เปิดได้เฉพาะผู้มีสิทธิ์ reports.view (backend ตรวจทุกครั้ง)
   */
  uploadReceipt: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await http.post<ItemResponse<{ url: string }>>(`${BASE}/receipts`, form);
    return res.data.url;
  },
};
