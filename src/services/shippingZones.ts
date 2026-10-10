// ─────────────────────────────────────────────────────────────
// src/services/shippingZones.ts — โซนค่าส่งเว็บ /admin/shipping-zones (สิทธิ์ store_info · BACKLOG4 F2 · backend Q-BE2)
//   GET   /admin/shipping-zones              โซน A–D (backend สร้างชุดเริ่มต้นให้ถ้ายังไม่มี)
//   PATCH /admin/shipping-zones/:zone_code   { zone_label?, fee?, provinces? } — จังหวัดซ้ำโซนอื่น = 409 · ไม่ใช่ 77 จังหวัด = 400
// หน้าร้านอ่านชุดเดียวกันจาก catalogService.shippingZones() (/catalog/shipping-zones)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { ShippingZone, ShippingZoneCode, ShippingZoneUpdate } from "@/types/shippingZone";

const BASE = "/admin/shipping-zones";

/* eslint-disable @typescript-eslint/no-explicit-any */
const toZone = (raw: any): ShippingZone => ({
  _id: String(raw._id ?? raw.zone_code),
  zone_code: raw.zone_code,
  zone_label: raw.zone_label ?? "",
  provinces: Array.isArray(raw.provinces) ? raw.provinces : [],
  fee: Number(raw.fee ?? 0),
});

export const shippingZonesService = {
  list: async (): Promise<ShippingZone[]> => (await http.getList<any>(BASE)).data.map(toZone),

  update: async (code: ShippingZoneCode, body: ShippingZoneUpdate): Promise<ShippingZone> =>
    toZone((await http.patch<ItemResponse<any>>(`${BASE}/${code}`, body)).data),
};
