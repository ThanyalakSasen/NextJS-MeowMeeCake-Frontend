// ─────────────────────────────────────────────────────────────
// src/services/orders.ts
// เรียก endpoint /orders (docs/API_CONTRACT.md §3) — 1 resource ต่อ 1 ไฟล์ ตามแพทเทิร์น services/products.ts
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { Order, OrderInput, OrderListParams } from "@/types/order";

const BASE = "/orders";

export const ordersService = {
  list: (params: OrderListParams = {}) =>
    http.get<ListResponse<Order>>(BASE, { params }),

  get: (id: string) =>
    http.get<ItemResponse<Order>>(`${BASE}/${id}`),

  create: (body: OrderInput) =>
    http.post<ItemResponse<Order>>(BASE, body),

  update: (id: string, body: Partial<OrderInput>) =>
    http.patch<ItemResponse<Order>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),
};
