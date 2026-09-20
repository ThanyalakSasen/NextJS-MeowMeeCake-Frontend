// ─────────────────────────────────────────────────────────────
// src/types/auth.ts
// DTO ฝั่ง auth ที่แอปนี้ใช้ภายใน (CurrentUser) + shape ดิบจริงจาก backend (RawAuthUser)
// backend คืน user object ดิบ (Mongoose, snake_case) ไม่ผ่าน DTO — src/lib/authClient.ts เป็นจุดเดียว
// ที่แปลง RawAuthUser → CurrentUser ก่อนส่งต่อให้ที่เหลือของแอป (Sidebar/ViewModel ฯลฯ ใช้ CurrentUser เท่านั้น)
// ─────────────────────────────────────────────────────────────
import type { MenuKey, MenuPermissionSet } from "@/constants/menuKeys";

export type MenuAction = keyof MenuPermissionSet; // "view" | "create" | ...

/** สิทธิ์ทุก menu_key ของ role ปัจจุบัน — owner/admin = true หมด */
export type MenuAccess = Record<MenuKey, MenuPermissionSet>;

/** DTO ภายในแอป — แปลงมาจาก RawAuthUser ใน authClient.ts */
export interface CurrentUser {
  id: string;
  email: string;
  fullname: string;
  roleId: string;
  roleName: string;
  menuAccess: MenuAccess;
}

/**
 * shape ดิบที่ backend ส่งจริง (POST /api/auth/login, GET /api/auth/me → { user: RawAuthUser })
 * เฉพาะ field ที่ frontend ใช้จริง — backend มี field อื่นอีกเยอะ (user_phone, is_active ฯลฯ) ไม่ได้ประกาศที่นี่
 */
export interface RawAuthUser {
  _id: string;
  email: string;
  user_fullname: string;
  role_id: { _id: string; role_name: string; role_type: "owner" | "staff" | "customer" } | string;
}

/**
 * สิทธิ์เมนูดิบที่ backend ส่งมากับ GET /api/auth/me → { user, permissions }
 * key = menu_key ของ backend (มี "preorder" ที่ frontend ยังไม่ใช้) · owner = true หมด · เมนูที่ไม่มีสิทธิ์ = false
 */
export type RawMenuPermissions = Record<
  string,
  { can_view: boolean; can_create: boolean; can_update: boolean; can_delete: boolean; can_approve: boolean }
>;

/** body ของ POST /auth/login */
export interface LoginInput {
  email: string;
  password: string;
}

export type { MenuKey, MenuPermissionSet };
