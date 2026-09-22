// ─────────────────────────────────────────────────────────────
// preorderStatus.ts — pure: flow ของสถานะ "รอบ" + "คำสั่งซื้อ" ในหน้านี้
// ปุ่มเปลี่ยนสถานะเดินหน้าทีละสถานะเท่านั้น (ตามแพทเทิร์น production/productionStatus.ts) — ไม่ใช้
// dropdown เลือกข้ามสถานะแบบ Manage Orders เดิม (orders/manageOrders/orderStatus.ts) ที่ปล่อยให้เลือก
// สถานะไหนก็ได้แม้ backend อนุญาตแค่บางสถานะถัดไป · ยกเลิกแยกปุ่มต่างหากเสมอ
// ─────────────────────────────────────────────────────────────
import { ORDER_STATUS_FLOW, ROUND_STATUS_FLOW } from "@/constants/enumConfig";
import type { OrderStatus, RoundStatus } from "@/constants/enumConfig";

export function isFinalRoundStatus(status: RoundStatus): boolean {
  return status === "closed" || status === "cancelled";
}

/** สถานะรอบถัดไปตาม flow ปกติ (ไม่รวม cancelled) — null ถ้าอยู่ท้าย flow แล้ว */
export function getNextRoundStatus(status: RoundStatus): RoundStatus | null {
  const idx = ROUND_STATUS_FLOW.indexOf(status);
  if (idx === -1 || idx === ROUND_STATUS_FLOW.length - 1) return null;
  return ROUND_STATUS_FLOW[idx + 1];
}

export function isFinalOrderStatus(status: OrderStatus): boolean {
  return status === "completed" || status === "cancelled";
}

/** สถานะออเดอร์ถัดไปตาม flow ปกติ (ไม่รวม cancelled) — null ถ้าอยู่ท้าย flow แล้ว */
export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(status);
  if (idx === -1 || idx === ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1];
}
