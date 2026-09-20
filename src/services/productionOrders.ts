// ─────────────────────────────────────────────────────────────
// src/services/productionOrders.ts
// เรียก endpoint /admin/production-orders — เปลี่ยนสถานะผ่าน sub-route /start /complete /cancel
// เท่านั้น (PATCH ตรง ๆ แก้ได้แค่ production_date/assigned_to/production_note — ดู types/productionOrder.ts)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type {
  RawProductionOrder,
  ProductionOrderCreateInput,
  ProductionOrderFromRoundInput,
  ProductionOrderUpdateInput,
  ProductionOrderListParams,
} from "@/types/productionOrder";

const BASE = "/admin/production-orders";

export const productionOrdersService = {
  list: (params: ProductionOrderListParams = {}) =>
    http.getList<RawProductionOrder>(BASE, { params }),

  get: (id: string) =>
    http.get<ItemResponse<RawProductionOrder>>(`${BASE}/${id}`),

  create: (body: ProductionOrderCreateInput) =>
    http.post<ItemResponse<RawProductionOrder>>(BASE, body),

  /** รวมยอดสั่งจริงจากรอบพรีออเดอร์ที่ "ปิดรับแล้ว" ให้อัตโนมัติ — round_id ต้องยังไม่มีใบสั่งผลิตอยู่ */
  createFromRound: (body: ProductionOrderFromRoundInput) =>
    http.post<ItemResponse<RawProductionOrder>>(`${BASE}/from-preorder-round`, body),

  update: (id: string, body: ProductionOrderUpdateInput) =>
    http.patch<ItemResponse<RawProductionOrder>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),

  /** planned → in_progress */
  start: (id: string) =>
    http.post<ItemResponse<RawProductionOrder>>(`${BASE}/${id}/start`, {}),

  /** in_progress → done — หักสต็อกวัตถุดิบของรายการที่ยังไม่ถูกหักให้ครบ */
  complete: (id: string, body: { use_actual?: boolean; allowNegative?: boolean } = {}) =>
    http.post<ItemResponse<RawProductionOrder>>(`${BASE}/${id}/complete`, body),

  /** → cancelled — คืนสต็อกวัตถุดิบที่หักไปแล้ว (ถ้ามี) */
  cancel: (id: string, body: { reason?: string } = {}) =>
    http.post<ItemResponse<RawProductionOrder>>(`${BASE}/${id}/cancel`, body),
};
