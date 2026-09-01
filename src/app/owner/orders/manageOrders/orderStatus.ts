// ─────────────────────────────────────────────────────────────
// orderStatus.ts — pure: flow ของสถานะออเดอร์ (ready + preorder ใช้ flow เดียวกัน)
// ─────────────────────────────────────────────────────────────
import { ORDER_STATUS_FLOW } from "@/constants/enumConfig";
import type { OrderStatus } from "@/constants/enumConfig";

export function isFinalStatus(status: OrderStatus): boolean {
  return status === "completed" || status === "cancelled";
}

/** ตัวเลือกใน dropdown เปลี่ยนสถานะ — flow ปกติ + ยกเลิกได้เสมอ */
export const STATUS_SELECT_OPTIONS: OrderStatus[] = [...ORDER_STATUS_FLOW, "cancelled"];
