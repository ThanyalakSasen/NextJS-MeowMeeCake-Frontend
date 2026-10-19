// ─────────────────────────────────────────────────────────────
// src/services/shippingZones.ts — โซนค่าส่งเว็บ /admin/shipping-zones (สิทธิ์ store_info · BACKLOG4 F2 · backend Q-BE2)
//   GET   /admin/shipping-zones              โซน A–D (backend สร้างชุดเริ่มต้นให้ถ้ายังไม่มี)
//   PATCH /admin/shipping-zones/:zone_code   { zone_label?, fee?, provinces? } — จังหวัดซ้ำโซนอื่น = 409 · ไม่ใช่ 77 จังหวัด = 400
//   GET   /admin/shipping-zones/categories      หมวดหมู่สินค้า + ส่งทั่วประเทศได้ไหม (ค่าที่มีผล + ยังไม่เคยตั้งหรือเปล่า)
//   PATCH /admin/shipping-zones/categories/:id  { ships_nationwide } — สิทธิ์ store_info.update (ไม่ต้องมีสิทธิ์สินค้า)
//   GET   /admin/shipping-zones/products        สินค้าทั้งหมด + ค่ายกเว้นรายสินค้า (null = ตามหมวด)
//   PATCH /admin/shipping-zones/products        { product_ids, ships_nationwide: true|false|null } — หลายชิ้นพร้อมกัน
// หน้าร้านอ่านชุดเดียวกันจาก catalogService.shippingZones() (/catalog/shipping-zones)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { CategoryShipping, ProductShipping, ShippingZone, ShippingZoneCode, ShippingZoneUpdate } from "@/types/shippingZone";

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

  listCategories: async (): Promise<CategoryShipping[]> =>
    (await http.getList<CategoryShipping>(`${BASE}/categories`)).data,

  /** resetProducts = ล้างค่ายกเว้นรายสินค้าในหมวดด้วย (เปิด/ปิดทั้งหมวด) */
  setCategoryShipping: async (id: string, shipsNationwide: boolean, resetProducts = false): Promise<CategoryShipping> =>
    (
      await http.patch<ItemResponse<CategoryShipping>>(`${BASE}/categories/${id}`, {
        ships_nationwide: shipsNationwide,
        ...(resetProducts ? { reset_products: true } : {}),
      })
    ).data,

  listProducts: async (): Promise<ProductShipping[]> =>
    (await http.getList<ProductShipping>(`${BASE}/products`)).data,

  /** ตั้งยกเว้นหลายสินค้า — true ส่งทั่วประเทศ · false เฉพาะจังหวัดร้าน · null กลับไปตามหมวด */
  setProductShipping: async (productIds: string[], shipsNationwide: boolean | null): Promise<{ updated: number }> =>
    (await http.patch<ItemResponse<{ updated: number }>>(`${BASE}/products`, { product_ids: productIds, ships_nationwide: shipsNationwide })).data,
};
