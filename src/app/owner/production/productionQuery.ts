// ─────────────────────────────────────────────────────────────
// productionQuery.ts — pure: แท็บ + query key ของหน้าการผลิต
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

export type TabKey = "plan" | "status" | "history";
const TAB_KEYS: TabKey[] = ["status", "plan", "history"];

/** แท็บที่เปิดจาก ?tab= · ไม่ระบุ (รวมลิงก์แจ้งเตือน ?id=) = แท็บสถานะ */
export function tabFrom(tab: string | null | undefined): TabKey {
  return TAB_KEYS.includes(tab as TabKey) ? (tab as TabKey) : "status";
}

export const PRODUCTION_ORDERS_PARAMS = { limit: LIST_ALL };
export const PRODUCTION_ORDERS_KEY = ["production-orders"] as const;
export const PRODUCTION_PRODUCTS_PARAMS = { limit: LIST_ALL };
export const PRODUCTION_PRODUCTS_KEY = ["products"] as const;
export const PRODUCTION_UNITS_KEY = ["units"] as const;
