// ─────────────────────────────────────────────────────────────
// src/types/storeAdmin.ts — DTO ของหลังร้าน "ข้อมูลร้าน" (BACKLOG4 E2 · backend storeService · customer-backend-merge.md §8.19)
//   /admin/store-profile (owner เท่านั้น) · /admin/store-settings (owner) · /admin/weekly-markets (สิทธิ์ store_info) · /admin/map-link (owner)
// ─────────────────────────────────────────────────────────────
import type { SocialKey, WeekDay } from "@/services/storeInfo";

export interface AdminWeeklyMarket {
  /** มีเฉพาะรายการที่บันทึกแล้ว — ต้องส่งกลับตอนบันทึก (ออเดอร์อ้างจุดรับด้วย _id นี้ · backend ตรวจสิทธิ์ create/update/delete จาก _id) */
  _id?: string;
  name: string;
  location: string;
  days: WeekDay[];
  /** HH:mm (24 ชม.) */
  open_time: string;
  close_time: string;
  map_url: string;
  /** false = ซ่อน (งดออกร้านชั่วคราว) · ต้องเปิดอย่างน้อย 1 แห่ง */
  is_active: boolean;
}

export interface PhoneContact {
  _id: string;
  user_fullname: string;
  user_phone: string | null;
}

export interface AdminStoreProfile {
  store_name: string;
  /** path จาก backend · ยังไม่อัปโหลด = /pictures/logoMoewMeeCake.png */
  logo_url: string;
  logo_updated_at: string | null;
  promptpay_id: string;
  promptpay_account_name: string;
  contact_email: string;
  social_links: Record<SocialKey, string>;
  /** เบอร์โทรร้าน = เบอร์ของพนักงานที่เลือก (populate) */
  phone_primary: PhoneContact | null;
  phone_secondary: PhoneContact | null;
  weekly_markets: AdminWeeklyMarket[];
  /** บัญชีที่ระบบใช้ส่งอีเมล (EMAIL_USER · อ่านอย่างเดียว) */
  system_email: string | null;
}

/** PUT /admin/store-profile — ส่งเฉพาะ field ของหัวข้อที่บันทึก (partial) */
export interface StoreProfileInput {
  store_name?: string;
  promptpay_id?: string;
  promptpay_account_name?: string;
  contact_email?: string;
  social_links?: Partial<Record<SocialKey, string>>;
  phone_primary_user_id?: string | null;
  phone_secondary_user_id?: string | null;
}

export interface StoreSettings {
  house_no: string;
  sub_district: string;
  district: string;
  province: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
}
