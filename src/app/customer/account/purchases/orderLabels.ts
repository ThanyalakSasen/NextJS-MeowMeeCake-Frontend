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

/**
 * วันนัดรับ → "จ. 6 ต.ค. 2569" — รับทั้ง "YYYY-MM-DD" และ ISO เต็มที่ backend ส่ง (เที่ยงคืนเวลาไทย = 17:00Z ของวันก่อน)
 * แสดงตามเวลาไทยเสมอ (เดิมต่อ "T00:00:00" ท้าย ISO → Invalid Date ทุกออเดอร์ที่มีวันรับ)
 */
export const pickupDateText = (value: string) => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+07:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
};
