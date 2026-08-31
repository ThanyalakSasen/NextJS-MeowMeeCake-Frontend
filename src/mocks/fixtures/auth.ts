// ─────────────────────────────────────────────────────────────
// src/mocks/fixtures/auth.ts  — MOCK owner user (D17)
// credential dev สำหรับ login ในโหมด mock — ดู docs/MOCKS.md
// ─────────────────────────────────────────────────────────────
import { ALL_MENU_KEYS, FULL_MENU_ACCESS } from "@/constants/menuKeys";
import type { CurrentUser, MenuAccess } from "@/types/auth";

/** ใช้ login ตอน NEXT_PUBLIC_API_MOCK=1 */
export const DEV_CREDENTIALS = {
  email: "owner@meowmeecake.local",
  password: "owner1234",
};

/** owner = เข้าถึงทุกเมนู */
export const MOCK_MENU_ACCESS: MenuAccess = Object.fromEntries(
  ALL_MENU_KEYS.map((k) => [k, { ...FULL_MENU_ACCESS }]),
) as MenuAccess;

export const MOCK_USER: CurrentUser = {
  id: "mock-user-owner",
  email: DEV_CREDENTIALS.email,
  fullname: "เจ้าของร้าน (Mock)",
  roleId: "mock-role-owner",
  roleName: "เจ้าของร้าน",
  menuAccess: MOCK_MENU_ACCESS,
};

/** cookie ที่ proxy.ts (Node) อ่านเพื่อรู้ว่า login แล้ว — non-httpOnly เพราะ mock ตั้งผ่าน document.cookie */
export const MOCK_AUTH_COOKIE = "mmc_session";
