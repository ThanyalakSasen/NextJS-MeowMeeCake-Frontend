// ─────────────────────────────────────────────────────────────
// productionStatus.ts — pure: flow ของสถานะการผลิต + helper ที่ Plan/Status/History tab ใช้ร่วมกัน
// ─────────────────────────────────────────────────────────────
import { PRODUCTION_STATUS_FLOW } from "@/constants/enumConfig";
import type { ProductionStatus } from "@/constants/enumConfig";

/** ลำดับคอลัมน์ kanban ในแท็บสถานะ — รวม cancelled ต่อท้าย flow ปกติ */
export const BOARD_COLUMNS: ProductionStatus[] = [...PRODUCTION_STATUS_FLOW, "cancelled"];

export function isFinalStatus(status: ProductionStatus): boolean {
  return status === "done" || status === "cancelled";
}

/** สถานะถัดไปตาม flow ปกติ (ไม่รวม cancelled) — null ถ้าอยู่ท้าย flow แล้ว */
export function getNextStatus(status: ProductionStatus): ProductionStatus | null {
  const idx = PRODUCTION_STATUS_FLOW.indexOf(status);
  if (idx === -1 || idx === PRODUCTION_STATUS_FLOW.length - 1) return null;
  return PRODUCTION_STATUS_FLOW[idx + 1];
}

/** body สำหรับ PATCH เปลี่ยนสถานะ — เติม started_at/completed_at อัตโนมัติครั้งแรกที่เข้าสถานะนั้น
 *  ใช้ทั้งลาก kanban การ์ด (StatusTab) และปุ่มเลื่อนสถานะ (ProductionOrderDetail) */
export function statusChangePatch(
  current: { started_at?: string | null; completed_at?: string | null },
  next: ProductionStatus,
): { production_status: ProductionStatus; started_at?: string; completed_at?: string } {
  const now = new Date().toISOString();
  return {
    production_status: next,
    ...(next === "in_progress" && !current.started_at ? { started_at: now } : {}),
    ...(next === "done" && !current.completed_at ? { completed_at: now } : {}),
  };
}

/** ระยะเวลาที่ใช้ผลิตจริง (ชม., ปัดทศนิยม 1 ตำแหน่ง) — null ถ้ายังไม่เริ่ม/ยังไม่เสร็จ */
export function durationHours(order: { started_at?: string | null; completed_at?: string | null }): number | null {
  if (!order.started_at || !order.completed_at) return null;
  const ms = new Date(order.completed_at).getTime() - new Date(order.started_at).getTime();
  return Math.round((ms / 3_600_000) * 10) / 10;
}

/** ตัวเลือกเดือนย้อนหลัง (ค่าใหม่สุดก่อน) — ใช้กรองแท็บประวัติ */
export function buildMonthOptions(locale: string, count = 6): { value: string; label: string }[] {
  const now = new Date();
  const tag = locale === "en" ? "en-US" : "th-TH";
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric" }).format(d);
    return { value, label };
  });
}
