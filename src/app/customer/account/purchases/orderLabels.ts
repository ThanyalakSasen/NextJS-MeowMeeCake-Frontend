// ป้ายสถานะออเดอร์ของหน้าร้าน (ประวัติการสั่งซื้อ + รายละเอียด) — ข้อความตาม FrontOffice
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "รอดำเนินการ",
  confirmed: "ยืนยันแล้ว",
  preparing: "กำลังเตรียมสินค้า",
  ready: "พร้อมส่ง / พร้อมรับ",
  completed: "สำเร็จ",
  cancelled: "ยกเลิกแล้ว",
};

/** สีป้ายสถานะออเดอร์ */
export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-50 text-sky-700",
  preparing: "bg-indigo-50 text-indigo-700",
  ready: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-stone-100 text-stone-500",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "รอชำระ / รอตรวจสอบ",
  paid: "ชำระแล้ว",
  failed: "ชำระไม่สำเร็จ",
  refunded: "คืนเงินแล้ว",
};

export const DELIVERY_STATUS_LABEL: Record<string, string> = {
  pending: "รอจัดส่ง",
  shipping: "กำลังจัดส่ง",
  delivered: "จัดส่งแล้ว",
  failed: "จัดส่งไม่สำเร็จ",
};

/** วันนัดรับ YYYY-MM-DD → "จ. 6 ต.ค. 2569" */
export const pickupDateText = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
