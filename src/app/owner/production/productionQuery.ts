// ─────────────────────────────────────────────────────────────
// productionQuery.ts — pure: แท็บ + query key ของหน้าการผลิต
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

export type TabKey = "plan" | "status" | "history";
// แท็บ "status" ปิดไว้ก่อน (ผู้ใช้ยังไม่ต้องการ — โค้ดยังอยู่) · เปิดคืน: ใส่ "status" กลับหน้าสุด + DEFAULT_TAB/ลิงก์ ?id= กลับเป็น "status"
// ?tab=status เดิม (บุ๊กมาร์ก/ลิงก์เก่า) ตกไปแท็บเริ่มต้นแทน
const TAB_KEYS: TabKey[] = [/* "status", */ "plan", "history"];
const DEFAULT_TAB: TabKey = "plan";

/** แท็บที่เปิดจาก ?tab= / ?id= — ลิงก์แจ้งเตือน (?id=) ไปแท็บแผนการผลิต (ป๊อปอัปรายละเอียดเปิดได้ทุกแท็บ) */
export function tabFrom(tab: string | null | undefined, id: string | null | undefined): TabKey {
  return TAB_KEYS.includes(tab as TabKey) ? (tab as TabKey) : id ? "plan" : DEFAULT_TAB;
}

export const PRODUCTION_ORDERS_PARAMS = { limit: LIST_ALL };
export const PRODUCTION_ORDERS_KEY = ["production-orders"] as const;
export const PRODUCTION_PRODUCTS_PARAMS = { limit: LIST_ALL };
export const PRODUCTION_PRODUCTS_KEY = ["products"] as const;
export const PRODUCTION_UNITS_KEY = ["units"] as const;
