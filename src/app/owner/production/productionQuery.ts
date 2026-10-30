// ─────────────────────────────────────────────────────────────
// productionQuery.ts — pure: แท็บ + query key ของหน้าการผลิต
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL, type HttpReader } from "@/lib/http";
import { productionOrdersService } from "@/services/productionOrders";
import type { RawProductionOrder } from "@/types/productionOrder";

export type TabKey = "plan" | "status" | "history";
// แท็บ "status" ปิดไว้ก่อน (ผู้ใช้ยังไม่ต้องการ — โค้ดยังอยู่) · เปิดคืน: ใส่ "status" กลับหน้าสุด + DEFAULT_TAB/ลิงก์ ?id= กลับเป็น "status"
// ?tab=status เดิม (บุ๊กมาร์ก/ลิงก์เก่า) ตกไปแท็บเริ่มต้นแทน
const TAB_KEYS: TabKey[] = [/* "status", */ "plan", "history"];
const DEFAULT_TAB: TabKey = "plan";

/** แท็บที่เปิดจาก ?tab= / ?id= — ลิงก์แจ้งเตือน (?id=) ไปแท็บแผนการผลิต (ป๊อปอัปรายละเอียดเปิดได้ทุกแท็บ) */
export function tabFrom(tab: string | null | undefined, id: string | null | undefined): TabKey {
  return TAB_KEYS.includes(tab as TabKey) ? (tab as TabKey) : id ? "plan" : DEFAULT_TAB;
}

export const PRODUCTION_ORDERS_KEY = ["production-orders"] as const;

// ── ใบสั่งผลิต (การ์ดวันนี้ผลิต · บอร์ดสถานะ · รอบที่มีใบแล้ว · ป๊อปอัปรายละเอียด) ──
// เดิมโหลด 1,000 ใบล่าสุดก้อนเดียว แล้วทุกแท็บกรองเอง — เกินนั้นใบเก่าหายเงียบ (ใบที่ยังไม่เสร็จหลุดจากการ์ด/ประวัติไม่ครบ)
// ตอนนี้: ใบที่ยังไม่จบ (รอดำเนินการ/กำลังผลิต) = โหลดครบเสมอ (คำขอเดียว) + ล่าสุด LIST_ALL ใบ
// แท็บประวัติดึงตามช่วงที่เลือกแยกต่างหาก (productionHistoryKey) — backend กรองช่วงให้
export async function fetchProductionOrders(h?: HttpReader): Promise<{ data: RawProductionOrder[] }> {
  const [open, recent] = await Promise.all([
    productionOrdersService.list({ production_status: "planned,in_progress", limit: LIST_ALL }, h),
    productionOrdersService.list({ limit: LIST_ALL }, h),
  ]);
  const byId = new Map<string, RawProductionOrder>();
  for (const o of [...recent.data, ...open.data]) byId.set(o._id, o);
  // เรียงแบบเดียวกับ backend: วันผลิตใหม่ → เก่า แล้วเวลาสร้าง
  const data = [...byId.values()].sort(
    (a, b) => b.production_date.localeCompare(a.production_date) || b.created_at.localeCompare(a.created_at),
  );
  return { data };
}

/** แท็บประวัติ: ใบในช่วงที่เลือก (เสร็จแล้ว = completed_at · อื่น ๆ = production_date) — อยู่ใต้ PRODUCTION_ORDERS_KEY (invalidate พร้อมกัน) */
export const productionHistoryKey = (from: string, to: string) => [...PRODUCTION_ORDERS_KEY, "history", from, to] as const;
export const productionHistoryParams = (from: string, to: string) => ({ history_from: from, history_to: to, limit: LIST_ALL });
export const PRODUCTION_PRODUCTS_PARAMS = { limit: LIST_ALL };
export const PRODUCTION_PRODUCTS_KEY = ["products"] as const;
export const PRODUCTION_UNITS_KEY = ["units"] as const;
