// ─────────────────────────────────────────────────────────────
// preorderQuery.ts — pure: แท็บ + query key ของหน้ารอบพรีออเดอร์
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { preordersService } from "@/services/preorders";
import { LIST_ALL, type HttpReader } from "@/lib/http";
import { ORDER_STATUS_FLOW } from "@/constants/enumConfig";
import type { Preorder } from "@/types/preorder";

export type TabKey = "rounds" | "dashboard" | "orders";
export const TAB_KEYS: TabKey[] = ["dashboard", "rounds", "orders"];

/** แท็บที่เปิดจาก ?tab= / ?id= (ลิงก์แจ้งเตือนพรีออเดอร์ → แท็บคำสั่งซื้อ) · ไม่ระบุ = สรุปรอบ — ตรรกะเดียวกับ ViewModel */
export function tabFrom(tab: string | null | undefined, id: string | null | undefined): TabKey {
  return TAB_KEYS.includes(tab as TabKey) ? (tab as TabKey) : id ? "orders" : "dashboard";
}

export const ROUNDS_KEY = ["preorder-rounds"] as const;
export const PREORDERS_KEY = ["preorders"] as const;
export const ROUND_DASHBOARD_KEY = ["preorder-rounds", "dashboard"] as const;

// ── รายการพรีออเดอร์ (แท็บคำสั่งซื้อ + นับยอดค้างตอนปิด/ยกเลิกรอบ) ──
// เดิมโหลด 1,000 รายการล่าสุดก้อนเดียว — เกินนั้นพรีออเดอร์เก่าที่ยังค้างหายเงียบ ๆ และเช็กยอดค้างในรอบพลาด
// ตอนนี้: ทุกสถานะที่ยังไม่ปิดงาน + ยกเลิกแล้วแต่ยังไม่คืนเงิน = โหลดครบเสมอ · + ล่าสุด LIST_ALL รายการ (ประวัติ)
// ปิดงานแล้วเก่ากว่านั้นไม่โหลด (olderHidden) → ค้นเลขพรีออเดอร์ที่ backend (preorderSearchKey)

/** ค้นเลขพรีออเดอร์ที่ backend — backend ค้นได้แค่ preorder_no */
export const preorderSearchKey = (term: string) => ["preorders", "search", term] as const;

const OPEN_STATUSES = ORDER_STATUS_FLOW.filter((s) => s !== "completed");

export interface PreordersData {
  data: Preorder[];
  /** มีพรีออเดอร์ปิดงานแล้วที่เก่ากว่ารายการที่โหลดไว้ */
  olderHidden: boolean;
  /** ยอดจริงจาก backend (ไม่ขึ้นกับจำนวนที่โหลด) — การ์ดสถิติ */
  total: number;
  completed: number;
}

export async function fetchPreorders(h?: HttpReader): Promise<PreordersData> {
  const [open, refunds, recent, completed] = await Promise.all([
    Promise.all(OPEN_STATUSES.map((s) => preordersService.list({ order_status: s, limit: LIST_ALL }, h))),
    preordersService.list({ order_status: "cancelled", payment_status: "paid", limit: LIST_ALL }, h),
    preordersService.list({ limit: LIST_ALL }, h),
    preordersService.list({ order_status: "completed", limit: 1 }, h),
  ]);
  const byId = new Map<string, Preorder>();
  for (const o of [...open.flatMap((r) => r.data), ...refunds.data, ...recent.data]) byId.set(o._id, o);
  return {
    data: [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    olderHidden: recent.meta.total > recent.data.length,
    total: recent.meta.total,
    completed: completed.meta.total,
  };
}
