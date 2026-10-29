// query key + ตัวโหลดรายการออเดอร์ของหน้าจัดการคำสั่งซื้อ (กรองฝั่ง client) — ใช้ร่วมกันระหว่าง ViewModel กับ page.tsx (server prefetch)
// ไฟล์นี้ไม่มี "use client" — server เรียกได้
//
// เดิมโหลด 1,000 รายการล่าสุดก้อนเดียว — ร้านมีออเดอร์เกินนั้นแล้วออเดอร์เก่าที่ยังค้าง (รอตรวจสลิป/รอส่ง/รอคืนเงิน) หายจากหน้าเงียบ ๆ
// ตอนนี้: ออเดอร์ที่ยังไม่ปิดงาน (ทุกสถานะก่อน completed) + ยกเลิกแล้วแต่ยังไม่คืนเงิน = โหลดครบเสมอ (ทีละสถานะ)
// + ออเดอร์ล่าสุด LIST_ALL รายการ (ส่วนใหญ่คือที่ปิดงานแล้ว — ประวัติ) · ปิดงานแล้วเก่ากว่านั้นไม่โหลด (olderHidden)
// → หาได้ด้วยการค้นเลขออเดอร์ที่ backend (orderSearchKey)
import { ordersService } from "@/services/orders";
import { LIST_ALL, type HttpReader } from "@/lib/http";
import { ORDER_STATUS_FLOW } from "@/constants/enumConfig";
import type { Order } from "@/types/order";

export const ORDERS_KEY = ["orders"] as const;

/** ค้นเลขออเดอร์ที่ backend (ออเดอร์ปิดแล้วที่เก่ากว่ารายการที่โหลดไว้) — backend ค้นได้แค่ order_no */
export const orderSearchKey = (orderType: string, term: string) => ["orders", "search", orderType, term] as const;

const OPEN_STATUSES = ORDER_STATUS_FLOW.filter((s) => s !== "completed");

export interface ManageOrdersData {
  data: Order[];
  /** มีออเดอร์ปิดงานแล้วที่เก่ากว่ารายการที่โหลดไว้ (ไม่แสดงในตาราง) */
  olderHidden: boolean;
}

export async function fetchManageOrders(h?: HttpReader): Promise<ManageOrdersData> {
  const [open, refunds, recent] = await Promise.all([
    Promise.all(OPEN_STATUSES.map((s) => ordersService.list({ order_status: s, limit: LIST_ALL }, h))),
    ordersService.list({ order_status: "cancelled", payment_status: "paid", limit: LIST_ALL }, h),
    ordersService.list({ limit: LIST_ALL }, h),
  ]);
  const byId = new Map<string, Order>();
  for (const o of [...open.flatMap((r) => r.data), ...refunds.data, ...recent.data]) byId.set(o._id, o);
  return {
    data: [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    olderHidden: recent.meta.total > recent.data.length,
  };
}
