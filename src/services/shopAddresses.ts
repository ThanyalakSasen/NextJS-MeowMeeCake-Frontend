// ─────────────────────────────────────────────────────────────
// src/services/shopAddresses.ts — สมุดที่อยู่ของลูกค้าที่ login (/shop/addresses*) · หน้าร้าน
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
};
