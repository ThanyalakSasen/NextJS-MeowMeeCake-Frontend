// ─────────────────────────────────────────────────────────────
// src/services/storeAdmin.ts — หลังร้าน "ข้อมูลร้าน" (BACKLOG4 E2) · ดู types/storeAdmin.ts
//   store-profile / store-settings / map-link = เจ้าของร้านเท่านั้น (403 สำหรับพนักงาน)
//   weekly-markets = สิทธิ์ store_info (backend ตรวจตามสิ่งที่เปลี่ยน: ใหม่ = create · แก้ = update · หาย = delete · ชนกัน = 409)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { AdminStoreProfile, AdminWeeklyMarket, PhoneContact, StoreProfileInput, StoreSettings } from "@/types/storeAdmin";

/* eslint-disable @typescript-eslint/no-explicit-any */

const toPhone = (v: any): PhoneContact | null =>
  v && typeof v === "object" ? { _id: String(v._id), user_fullname: v.user_fullname ?? "", user_phone: v.user_phone ?? null } : null;

export const toWeeklyMarket = (m: any): AdminWeeklyMarket => ({
  ...(m?._id ? { _id: String(m._id) } : {}),
  name: m?.name ?? "",
  location: m?.location ?? "",
  days: Array.isArray(m?.days) ? m.days : [],
  open_time: m?.open_time ?? "",
  close_time: m?.close_time ?? "",
  map_url: m?.map_url ?? "",
  is_active: m?.is_active !== false,
});

function toProfile(raw: any): AdminStoreProfile {
  const social = raw?.social_links ?? {};
  return {
    store_name: raw?.store_name ?? "",
    logo_url: raw?.logo_url ?? "",
    logo_updated_at: raw?.logo_updated_at ?? null,
    promptpay_id: raw?.promptpay_id ?? "",
    promptpay_account_name: raw?.promptpay_account_name ?? "",
    contact_email: raw?.contact_email ?? "",
    social_links: {
      facebook: social.facebook ?? "",
      line: social.line ?? "",
      instagram: social.instagram ?? "",
      website: social.website ?? "",
    },
    phone_primary: toPhone(raw?.phone_primary_user_id),
    phone_secondary: toPhone(raw?.phone_secondary_user_id),
    weekly_markets: (raw?.weekly_markets ?? []).map(toWeeklyMarket),
    system_email: raw?.system_email ?? null,
  };
}

function toSettings(raw: any): StoreSettings {
  return {
    house_no: raw?.house_no ?? "",
    sub_district: raw?.sub_district ?? "",
    district: raw?.district ?? "",
    province: raw?.province ?? "",
    zip_code: raw?.zip_code ?? "",
    latitude: typeof raw?.latitude === "number" ? raw.latitude : null,
    longitude: typeof raw?.longitude === "number" ? raw.longitude : null,
  };
}

export const storeAdminService = {
  profile: async (): Promise<AdminStoreProfile> => toProfile((await http.get<ItemResponse<any>>("/admin/store-profile")).data),

  /** มีโลโก้ = multipart { payload, logo } (backend อัปโหลด + ลบโลโก้เก่าเอง) · ไม่มี = JSON */
  updateProfile: async (body: StoreProfileInput, logo?: File | null): Promise<AdminStoreProfile> => {
    if (logo) {
      const form = new FormData();
      form.append("payload", JSON.stringify(body));
      form.append("logo", logo);
      return toProfile((await http.put<ItemResponse<any>>("/admin/store-profile", form, { timeout: 60_000 })).data);
    }
    return toProfile((await http.put<ItemResponse<any>>("/admin/store-profile", body)).data);
  },

  settings: async (): Promise<StoreSettings> => toSettings((await http.get<ItemResponse<any>>("/admin/store-settings")).data),

  updateSettings: async (body: StoreSettings): Promise<StoreSettings> =>
    toSettings((await http.put<ItemResponse<any>>("/admin/store-settings", body)).data),

  weeklyMarkets: async (): Promise<AdminWeeklyMarket[]> =>
    ((await http.get<ItemResponse<{ weekly_markets?: any[] }>>("/admin/weekly-markets")).data?.weekly_markets ?? []).map(toWeeklyMarket),

  /** แทนที่ทั้งรายการ — ส่ง _id ของรายการเดิมกลับเสมอ */
  updateWeeklyMarkets: async (markets: AdminWeeklyMarket[]): Promise<AdminWeeklyMarket[]> =>
    ((await http.put<ItemResponse<{ weekly_markets?: any[] }>>("/admin/weekly-markets", { weekly_markets: markets })).data?.weekly_markets ?? []).map(
      toWeeklyMarket,
    ),

  /** ลิงก์ย่อ maps.app.goo.gl → พิกัด (server ตาม redirect ให้ · 20 ครั้ง/10 นาที) */
  resolveMapLink: async (url: string): Promise<{ lat: number; lng: number }> => {
    const res = await http.post<ItemResponse<{ lat: number; lng: number }>>("/admin/map-link", { url });
    return { lat: res.data.lat, lng: res.data.lng };
  },
};
