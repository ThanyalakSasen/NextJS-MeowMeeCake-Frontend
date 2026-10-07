// ─────────────────────────────────────────────────────────────
// src/services/shopProfile.ts — บัญชีของลูกค้าที่ login (/shop/me*) · หน้า /customer/account (BACKLOG3-merge B2)
//   GET/PATCH /shop/me            โปรไฟล์ (ชื่อ · เบอร์ · วันเกิด · อาหารที่แพ้) — อีเมลแก้ที่นี่ไม่ได้
//   PATCH /shop/me/password       เปลี่ยนรหัสผ่าน (ต้องรู้รหัสเดิม) — เครื่องอื่นหลุด · เครื่องนี้ได้ cookie ใหม่
//   GET/POST /shop/me/email       บัญชีที่สมัครด้วย LINE: ตั้งอีเมลจริงแทนอีเมลชั่วคราว + ส่งลิงก์ยืนยัน
// ผูก/ยกเลิก LINE ใช้ services/shopLine.ts (/shop/me/line)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";

export type AuthProvider = "local" | "google" | "line";

export interface ShopProfile {
  _id: string;
  user_fullname: string;
  email: string;
  user_phone: string | null;
  /** ISO */
  user_birthdate: string | null;
  user_img: string | null;
  user_allergies: string[];
  auth_provider: AuthProvider;
  is_email_verified: boolean;
}

export interface ShopProfileInput {
  user_fullname?: string;
  user_phone?: string | null;
  /** YYYY-MM-DD */
  user_birthdate?: string | null;
  user_allergies?: string[];
}

/** GET /shop/me/email — needs_email = บัญชี LINE ที่ยังใช้อีเมลชั่วคราว (ให้ลูกค้ากรอกอีเมลจริง) */
export interface EmailStatus {
  auth_provider: AuthProvider;
  line_linked: boolean;
  needs_email: boolean;
  email: string | null;
  email_verified: boolean;
}

/** อีเมลชั่วคราวของบัญชี LINE ที่ไม่ได้ให้อีเมล — ย้ายไป lib/lineAccount.ts (ใช้ร่วมกับหลังร้าน · I10) · re-export ให้โค้ดเดิม */
export { isLinePlaceholderEmail } from "@/lib/lineAccount";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toProfile(raw: any): ShopProfile {
  return {
    _id: raw._id,
    user_fullname: raw.user_fullname ?? "",
    email: raw.email ?? "",
    user_phone: raw.user_phone ?? null,
    user_birthdate: raw.user_birthdate ?? null,
    user_img: raw.user_img ?? null,
    user_allergies: Array.isArray(raw.user_allergies) ? raw.user_allergies : [],
    auth_provider: raw.auth_provider ?? "local",
    is_email_verified: raw.is_email_verified === true,
  };
}

export const shopProfileService = {
  get: async (): Promise<ShopProfile> => {
    const res = await http.get<ItemResponse<{ user: any }>>("/shop/me");
    return toProfile(res.data.user);
  },

  /** ข้อมูลส่วนตัวครบ (ชื่อ · เบอร์ · วันเกิด) ครั้งแรก → backend ให้โบนัสแต้ม */
  update: async (body: ShopProfileInput): Promise<ShopProfile> => {
    const res = await http.patch<ItemResponse<{ user: any }>>("/shop/me", body);
    return toProfile(res.data.user);
  },

  /** รหัสเดิมผิด / บัญชีไม่มีรหัสผ่าน = 400 · 5 ครั้ง/นาที */
  changePassword: (current: string, next: string) =>
    http.patch<ItemResponse<{ success: boolean }>>("/shop/me/password", { current_password: current, new_password: next }),

  emailStatus: async (): Promise<EmailStatus> => {
    const res = await http.get<ItemResponse<EmailStatus>>("/shop/me/email");
    return res.data;
  },

  /** เฉพาะบัญชี LINE ที่อีเมลยังไม่ยืนยัน · อีเมลซ้ำบัญชีอื่น = 409 · คืนข้อความของ backend */
  setEmail: async (email: string): Promise<string | undefined> => {
    const res = await http.post<ItemResponse<{ message?: string }>>("/shop/me/email", { email });
    return res.data?.message;
  },
};
