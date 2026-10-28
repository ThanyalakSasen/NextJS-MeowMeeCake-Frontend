// ─────────────────────────────────────────────────────────────
// orderStatus.ts — pure: flow ของสถานะออเดอร์ (ready + preorder ใช้ flow เดียวกัน)
// ─────────────────────────────────────────────────────────────
import { ORDER_STATUS_FLOW } from "@/constants/enumConfig";
import type { OrderStatus } from "@/constants/enumConfig";
import type { OrderType } from "@/types/order";

export function isFinalStatus(status: OrderStatus): boolean {
  return status === "completed" || status === "cancelled";
}

/** ทุกสถานะ — ใช้ตรวจค่า ?status= ใน URL */
export const STATUS_SELECT_OPTIONS: OrderStatus[] = [...ORDER_STATUS_FLOW, "cancelled"];

/**
 * ตัวเลือกใน dropdown เปลี่ยนสถานะ = สถานะปัจจุบัน + สถานะถัดไป + ยกเลิก
 * backend เดินหน้าได้ทีละขั้นเท่านั้น (orderService NEXT_STATUS) — เดิมให้เลือกข้าม/ย้อนสถานะได้แล้วโดน 409
 */
export function statusSelectOptions(current: OrderStatus, orderType: OrderType): OrderStatus[] {
  if (isFinalStatus(current)) return [current];
  // ออเดอร์จัดส่ง: พร้อมส่งมอบ → สำเร็จ ต้องผ่านปุ่ม "จัดส่งเรียบร้อยแล้ว" (บังคับกรอกขนส่ง/เลขพัสดุ) เท่านั้น
  if (orderType === "delivery" && current === "ready") return [current, "cancelled"];
  const next = ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(current) + 1];
  return next ? [current, next, "cancelled"] : [current, "cancelled"];
}
