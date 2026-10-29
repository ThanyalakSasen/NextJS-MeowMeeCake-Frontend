// ─────────────────────────────────────────────────────────────
// src/services/productionOrders.ts
// เรียก endpoint /admin/production-orders — เปลี่ยนสถานะผ่าน sub-route /start /complete /cancel
// เท่านั้น (PATCH ตรง ๆ แก้ได้แค่ production_date/assigned_to/production_note — ดู types/productionOrder.ts)
// ─────────────────────────────────────────────────────────────
import { http, type HttpReader } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type {
  RawProductionOrder,
  ProductionOrderCreateInput,
  ProductionOrderFromRoundInput,
  ProductionFromRoundPreview,
  ProductionOrderUpdateInput,
  ProductionOrderListParams,
} from "@/types/productionOrder";

const BASE = "/admin/production-orders";
const ITEMS_BASE = "/admin/production-items";

export const productionOrdersService = {
  /** h = http client (ค่าเริ่มต้น http ปกติ) — ฝั่ง server ส่ง withConfig(cookie + no-store) เข้ามา (production/page.tsx) */
  list: (params: ProductionOrderListParams = {}, h: HttpReader = http) =>
    h.getList<RawProductionOrder>(BASE, { params }),

  get: (id: string) =>
    http.get<ItemResponse<RawProductionOrder>>(`${BASE}/${id}`),

  create: (body: ProductionOrderCreateInput) =>
    http.post<ItemResponse<RawProductionOrder>>(BASE, body),

  /** รวมยอดสั่งจริงจากรอบพรีออเดอร์ที่ "ปิดรับแล้ว" ให้อัตโนมัติ — round_id ต้องยังไม่มีใบสั่งผลิตอยู่ */
  createFromRound: (body: ProductionOrderFromRoundInput) =>
    http.post<ItemResponse<RawProductionOrder>>(`${BASE}/from-preorder-round`, body),

  /** ดูล่วงหน้าว่ารอบนี้จะได้ใบสั่งผลิตแบบไหน + เหตุที่สร้างไม่ได้ (ฟอร์มสร้างจากรอบ) */
  previewFromRound: (roundId: string) =>
    http.get<ItemResponse<ProductionFromRoundPreview>>(`${BASE}/from-preorder-round`, { params: { round_id: roundId } }),

  update: (id: string, body: ProductionOrderUpdateInput) =>
    http.patch<ItemResponse<RawProductionOrder>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),

  /** PATCH /admin/production-items/[id] — ใช้บันทึกจำนวนที่ผลิตได้จริงก่อนปิดงาน (actual_qty) · 0 = ยกเลิกรายการ */
  updateItem: (itemId: string, body: { actual_qty?: number; item_status?: "cancelled" }) =>
    http.patch<ItemResponse<unknown>>(`${ITEMS_BASE}/${itemId}`, body),

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
