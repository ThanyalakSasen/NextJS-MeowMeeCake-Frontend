"use client";

// ─────────────────────────────────────────────────────────────
// src/context/PermissionsContext.tsx
// เก็บ menuAccess ของผู้ใช้ปัจจุบัน (จาก /auth/me) ให้ทั้ง owner tree เรียกใช้
// usePermission(key) → { view, create, update, delete, approve }
//
// ⚠️ นี่คือ "UX gate" เท่านั้น (ซ่อน/โชว์ปุ่ม) — ตัวบังคับสิทธิ์จริงอยู่ที่ backend
// ─────────────────────────────────────────────────────────────
import { createContext, useContext } from "react";
import type { MenuAccess } from "@/types/auth";
import type { MenuKey, MenuPermissionSet } from "@/constants/menuKeys";
import { NO_MENU_ACCESS } from "@/constants/menuKeys";

const PermissionsCtx = createContext<MenuAccess | null>(null);

export function PermissionsProvider({
  value,
  children,
}: {
  value: MenuAccess | null;
  children: React.ReactNode;
}) {
  return <PermissionsCtx.Provider value={value}>{children}</PermissionsCtx.Provider>;
}

/** สิทธิ์ของเมนูเดียว — ยังโหลดไม่เสร็จ = ปิดทุกอย่าง (fail closed) */
export function usePermission(key: MenuKey): MenuPermissionSet {
  const access = useContext(PermissionsCtx);
  return access?.[key] ?? NO_MENU_ACCESS;
}

/** ทั้ง map — ใช้ตอนกรองเมนู sidebar */
export function useMenuAccess(): MenuAccess | null {
  return useContext(PermissionsCtx);
}
