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
};
