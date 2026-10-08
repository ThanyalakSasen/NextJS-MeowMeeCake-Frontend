// ─────────────────────────────────────────────────────────────
// src/services/storeInfo.ts — ข้อมูลร้าน + ฟอร์มติดต่อร้าน · หน้าร้าน (BACKLOG3-merge D8 · ใช้ต่อใน D9)
//   GET  /catalog/store-info       ชื่อร้าน · โลโก้ · เบอร์ · อีเมล · โซเชียล · หน้าร้านประจำสัปดาห์ (เปิดแสดง) · ที่อยู่ · พิกัด
//                                  ตั้งค่าที่หลังร้าน "ข้อมูลร้าน" (E2) · ค่าที่ยังไม่ตั้ง = "" / [] / null
//   GET  /catalog/contact-topics   หัวข้อฟอร์มติดต่อ + ความยาวข้อความสูงสุด
//   POST /shop/contact             { topic, message } (ต้อง login) → แจ้งเตือนหลังร้านหมวด "ลูกค้า" + LINE เจ้าของร้าน
//                                  ชื่อ/เบอร์/อีเมลผู้ส่ง backend ดึงจากบัญชีเอง · 1 ข้อความ/นาที (429)
//   GET  /catalog/shipping-zones   โซนค่าส่งเว็บ A–D ตามจังหวัด (D9 · โซนที่ไม่มีจังหวัด = จังหวัดที่เหลือ)
//   GET  /catalog/store-logo       { url, updated_at } โลโก้ล่าสุด (D9 · ยังไม่อัปโหลด = /pictures/logoMoewMeeCake.png ของหน้าเว็บ)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type SocialKey = "facebook" | "line" | "instagram" | "website";

export interface WeeklyMarket {
  name: string;
  location: string;
  days: WeekDay[];
  /** HH:mm */
  open_time: string;
  close_time: string;
  map_url: string;
}

export interface StoreAddress {
  house_no: string;
  sub_district: string;
  district: string;
  province: string;
  zip_code: string;
}

export interface StoreInfo {
  store_name: string;
  /** path จาก backend (ผ่าน resolveUploadUrl ก่อนแสดง) · ไม่ตั้ง = โลโก้เริ่มต้นของ backend */
  logo_url: string;
  phones: string[];
  contact_email: string;
  social_links: Record<SocialKey, string>;
  weekly_markets: WeeklyMarket[];
  address: StoreAddress;
  location: { latitude: number; longitude: number } | null;
}

export interface ContactTopics {
  topics: string[];
  max_length: number;
}

export const storeInfoService = {
  get: async (): Promise<StoreInfo> => (await http.get<ItemResponse<StoreInfo>>("/catalog/store-info")).data,

  contactTopics: async (): Promise<ContactTopics> =>
    (await http.get<ItemResponse<ContactTopics>>("/catalog/contact-topics")).data,

  sendContact: async (body: { topic: string; message: string }): Promise<void> => {
    await http.post("/shop/contact", body);
  },

  shippingZones: async (): Promise<ShippingZone[]> => (await http.getList<ShippingZone>("/catalog/shipping-zones")).data,

  logo: async (): Promise<StoreLogo> => (await http.get<ItemResponse<StoreLogo>>("/catalog/store-logo")).data,
};

export interface ShippingZone {
  zone_code: string;
  zone_label: string;
  /** ว่าง = จังหวัดที่ไม่อยู่ในโซนอื่น */
  provinces: string[];
  fee: number;
}

export interface StoreLogo {
  url: string;
  updated_at: string | null;
}
