// ─────────────────────────────────────────────────────────────
// src/types/auth.ts
// DTO ฝั่ง auth — ตรงกับ GET /auth/me และ POST /auth/login (docs/API_CONTRACT.md §2)
// ─────────────────────────────────────────────────────────────
import type { MenuKey, MenuPermissionSet } from "@/constants/menuKeys";

export type MenuAction = keyof MenuPermissionSet; // "view" | "create" | ...

/** สิทธิ์ทุก menu_key ของ role ปัจจุบัน — owner/admin = true หมด */
export type MenuAccess = Record<MenuKey, MenuPermissionSet>;

/** ผลจาก GET /auth/me */
export interface CurrentUser {
  id: string;
  email: string;
  fullname: string;
  roleId: string;
  roleName: string;
  menuAccess: MenuAccess;
}

/** body ของ POST /auth/login */
export interface LoginInput {
  email: string;
  password: string;
}

export type { MenuKey, MenuPermissionSet };
