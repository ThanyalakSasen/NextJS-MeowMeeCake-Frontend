// ─────────────────────────────────────────────────────────────
// src/services/shopAddresses.ts — สมุดที่อยู่ของลูกค้าที่ login (/shop/addresses*) · checkout + /customer/account/address
// เก็บแค่ตำแหน่ง ไม่เก็บชื่อ/เบอร์ผู้รับ — ตอนสั่งซื้อด้วย address_id ต้องส่ง recipient_name/recipient_phone คู่กัน
// (schemas/order.ts createOrderBody ฝั่ง backend)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";

export interface ShopAddress {
  _id: string;
  house_no: string;
  sub_district: string;
  district: string;
  province: string;
  zip_code: string;
  is_default: boolean;
}

export type ShopAddressInput = Omit<ShopAddress, "_id" | "is_default"> & { is_default?: boolean };

export const shopAddressesService = {
  /** GET /shop/addresses — ที่อยู่ default อยู่บนสุด */
  list: async (): Promise<ShopAddress[]> => {
    const res = await http.get<ItemResponse<ShopAddress[]>>("/shop/addresses");
    return res.data ?? [];
  },

  /** POST /shop/addresses — zip_code ต้องเป็นตัวเลข 5 หลัก */
  create: async (body: ShopAddressInput): Promise<ShopAddress> => {
    const res = await http.post<ItemResponse<ShopAddress>>("/shop/addresses", body);
    return res.data;
  },

  /** PATCH /shop/addresses/{id} — แก้บางส่วนได้ */
  update: async (id: string, body: Partial<ShopAddressInput>): Promise<ShopAddress> => {
    const res = await http.patch<ItemResponse<ShopAddress>>(`/shop/addresses/${id}`, body);
    return res.data;
  },

  /** DELETE /shop/addresses/{id} — soft delete · ลบอันที่เป็นค่าเริ่มต้น = backend เลื่อนอันอื่นขึ้นแทน */
  remove: async (id: string): Promise<void> => {
    await http.delete(`/shop/addresses/${id}`);
  },

  /** POST /shop/addresses/{id}/default — ตั้งเป็นที่อยู่เริ่มต้น (อันเดิมถูกปลดให้เอง) */
  setDefault: async (id: string): Promise<void> => {
    await http.post(`/shop/addresses/${id}/default`);
  },
};
