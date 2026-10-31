// ─────────────────────────────────────────────────────────────
// src/services/purchases.ts
// POST /admin/purchases — บันทึกการซื้อวัตถุดิบ (รับเข้าสต็อก + ค่าใช้จ่าย 1 ใบ ในคำขอเดียว)
// สิทธิ์: finance_expenses.create และ ingredient_stock.update
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { PurchaseInput, PurchaseResult } from "@/types/purchase";

export const purchasesService = {
  create: (body: PurchaseInput) => http.post<ItemResponse<PurchaseResult>>("/admin/purchases", body),
};
