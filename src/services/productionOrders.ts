// ─────────────────────────────────────────────────────────────
// src/services/productionOrders.ts
// เรียก endpoint /production-orders — แพทเทิร์นเดียวกับ services/orders.ts
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { ProductionOrder, ProductionOrderInput, ProductionOrderListParams } from "@/types/productionOrder";

const BASE = "/production-orders";

export const productionOrdersService = {
  list: (params: ProductionOrderListParams = {}) =>
    http.get<ListResponse<ProductionOrder>>(BASE, { params }),

  get: (id: string) =>
    http.get<ItemResponse<ProductionOrder>>(`${BASE}/${id}`),

  create: (body: ProductionOrderInput) =>
    http.post<ItemResponse<ProductionOrder>>(BASE, body),

  update: (id: string, body: Partial<ProductionOrderInput>) =>
    http.patch<ItemResponse<ProductionOrder>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),
};
