// ─────────────────────────────────────────────────────────────
// src/lib/landingPath.ts
// หน้าแรกของหลังร้านตามสิทธิ์ — ใช้เมื่อผู้ใช้เปิดแดชบอร์ด (หน้าแรกหลังล็อกอิน) แต่ไม่มี dashboard.view
// เลือกเมนูแรกตามลำดับ Sidebar (constants/menu.ts) ที่ผูก menuKey และผู้ใช้มีสิทธิ์ view
// ไม่นับเมนูที่ไม่ผูก menuKey (login พอ) — กันพาไปหน้าที่ API ข้างในยังต้องใช้สิทธิ์อื่น (Final-Backlog P11)
// ─────────────────────────────────────────────────────────────
import { MENU_SECTIONS } from "@/constants/menu";
import type { MenuAccess } from "@/types/auth";

/** path แรกที่เปิดได้ (ไม่รวมแดชบอร์ด) · ไม่มีสักเมนู = null */
export function firstPermittedPath(access: MenuAccess): string | null {
  for (const section of MENU_SECTIONS) {
    for (const item of section.items) {
      const leaves = item.children ?? (item.href ? [{ href: item.href, menuKey: item.menuKey }] : []);
      for (const leaf of leaves) {
        if (leaf.menuKey && leaf.menuKey !== "dashboard" && access[leaf.menuKey]?.view) return leaf.href;
      }
    }
  }
  return null;
}
