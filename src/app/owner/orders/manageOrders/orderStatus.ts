// ─────────────────────────────────────────────────────────────
// orderStatus.ts — pure: flow ของสถานะออเดอร์ (ready + preorder ใช้ flow เดียวกัน)
// ─────────────────────────────────────────────────────────────
import { ORDER_STATUS_FLOW } from "@/constants/enumConfig";
import type { OrderStatus } from "@/constants/enumConfig";

export function isFinalStatus(status: OrderStatus): boolean {
  return status === "completed" || status === "cancelled";
}

/** ทุกสถานะ — ใช้ตรวจค่า ?status= ใน URL */
export const STATUS_SELECT_OPTIONS: OrderStatus[] = [...ORDER_STATUS_FLOW, "cancelled"];

/**
 * ตัวเลือกใน dropdown เปลี่ยนสถานะ = สถานะปัจจุบัน + สถานะถัดไป + ยกเลิก
 * backend เดินหน้าได้ทีละขั้นเท่านั้น (orderService NEXT_STATUS) — เดิมให้เลือกข้าม/ย้อนสถานะได้แล้วโดน 409
 * delivery = แบบจัดส่ง — ไม่มี "สำเร็จ" ให้เลือก ปิดงานโดยตั้งสถานะจัดส่ง "จัดส่งเรียบร้อย" (บังคับเลขพัสดุ · DeliverySection)
 */
export function statusSelectOptions(current: OrderStatus, opts: { delivery?: boolean } = {}): OrderStatus[] {
  if (isFinalStatus(current)) return [current];
  const next = ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(current) + 1];
  return next && !(opts.delivery && next === "completed") ? [current, next, "cancelled"] : [current, "cancelled"];
}
