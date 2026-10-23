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

/**
 * จำนวนที่ผลิตได้จริงของรายการ (ใช้กับใบที่ปิดงานแล้ว) — รายการที่ยกเลิก (ปิดงานด้วย 0) = 0 ·
 * มี actual_qty = ตามนั้น · ปิดงานแบบ "จำนวนที่วางแผน" ไม่มี actual_qty = ใช้ planned_qty
 * (เดิมประวัติการผลิตรวม planned_qty ตรง ๆ จึงไม่ตรงกับที่ผลิตได้จริง — TC-ADM-94)
 */
export function producedQty(item: { planned_qty: number; actual_qty?: number | null; item_status: string }): number {
  if (item.item_status === "cancelled") return 0;
  return item.actual_qty ?? item.planned_qty;
}

/** ระยะเวลาที่ใช้ผลิตจริง (ชม., ปัดทศนิยม 1 ตำแหน่ง) — null ถ้ายังไม่เริ่ม/ยังไม่เสร็จ */
export function durationHours(order: { started_at?: string | null; completed_at?: string | null }): number | null {
  if (!order.started_at || !order.completed_at) return null;
  const ms = new Date(order.completed_at).getTime() - new Date(order.started_at).getTime();
  return Math.round((ms / 3_600_000) * 10) / 10;
}
