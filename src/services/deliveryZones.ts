// ─────────────────────────────────────────────────────────────
// src/services/deliveryZones.ts — โซนค่าจัดส่งหลังร้าน (BACKLOG4 I8) · สิทธิ์เมนู orders (view/create/update/delete)
// ลบ = soft delete (กู้คืนได้ — POST :id/restore) · แก้แล้ว backend ล้าง cache ให้ ค่าส่งใหม่ใช้ทันที
// ─────────────────────────────────────────────────────────────
import { http, LIST_ALL } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { DeliveryFeeOverview, DeliveryZone, DeliveryZoneInput } from "@/types/deliveryZone";

/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = "/admin/delivery-zones";

const toZone = (raw: any): DeliveryZone => ({
  _id: String(raw._id),
  zone_name: raw.zone_name ?? "",
  provinces: Array.isArray(raw.provinces) ? raw.provinces : [],
  is_catch_all: !!raw.is_catch_all,
  fee: Number(raw.fee ?? 0),
  sort_order: Number(raw.sort_order ?? 0),
  is_active: raw.is_active !== false,
  deleted_at: raw.deleted_at ?? null,
});

export const deliveryZonesService = {
  /** ทุกโซนรวมที่ลบแล้ว เรียงตามลำดับ (มีไม่กี่โซน — ไม่แบ่งหน้า) */
  list: async (): Promise<DeliveryZone[]> =>
    (await http.getList<any>(BASE, { params: { limit: LIST_ALL, includeDeleted: true, sortBy: "sort_order", sortOrder: "asc" } })).data.map(toZone),
  create: async (body: DeliveryZoneInput): Promise<DeliveryZone> => toZone((await http.post<ItemResponse<any>>(BASE, body)).data),
  update: async (id: string, body: Partial<DeliveryZoneInput>): Promise<DeliveryZone> =>
    toZone((await http.patch<ItemResponse<any>>(`${BASE}/${id}`, body)).data),
  remove: async (id: string): Promise<void> => {
    await http.delete(`${BASE}/${id}`);
  },
  restore: async (id: string): Promise<DeliveryZone> => toZone((await http.post<ItemResponse<any>>(`${BASE}/${id}/restore`)).data),
  /** GET /admin/delivery-fee — ค่าส่งที่ใช้อยู่จริง (โซนจาก DB หรือค่าตั้งต้นจาก env) + ยอดส่งฟรี */
  overview: async (): Promise<DeliveryFeeOverview> => (await http.get<ItemResponse<DeliveryFeeOverview>>("/admin/delivery-fee")).data,
};
