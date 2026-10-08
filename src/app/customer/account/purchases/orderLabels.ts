// ป้ายสถานะออเดอร์ของหน้าร้าน (ประวัติการสั่งซื้อ + รายละเอียด + พรีออเดอร์) — ข้อความอยู่ใน i18n shop.orderStatus / paymentStatus / deliveryStatus
import { useLocale, useTranslations } from "next-intl";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
const DELIVERY_STATUSES = ["pending", "shipping", "delivered", "failed"] as const;

/** สีป้ายสถานะออเดอร์ */
export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-50 text-sky-700",
  preparing: "bg-indigo-50 text-indigo-700",
  ready: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-stone-100 text-stone-500",
};

/**
 * วันนัดรับ → "จ. 6 ต.ค. 2569" / "Mon, Oct 6, 2026" — รับทั้ง "YYYY-MM-DD" และ ISO เต็มที่ backend ส่ง (เที่ยงคืนเวลาไทย = 17:00Z ของวันก่อน)
 * แสดงตามเวลาไทยเสมอ (เดิมต่อ "T00:00:00" ท้าย ISO → Invalid Date ทุกออเดอร์ที่มีวันรับ)
 */
export const pickupDateText = (value: string, locale: string = "th") => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+07:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(locale === "en" ? "en-US" : "th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
};

/** ข้อความสถานะ + วันนัดรับ ตามภาษาปัจจุบัน */
export function useOrderLabels() {
  const t = useTranslations("shop");
  const locale = useLocale();
  return {
    orderStatus: (s: OrderStatus) => t(`orderStatus.${s}`),
    paymentStatus: (s: PaymentStatus) => t(`paymentStatus.${s}`),
    /** สถานะที่ไม่รู้จัก = แสดงค่าดิบ */
    deliveryStatus: (s: string) => ((DELIVERY_STATUSES as readonly string[]).includes(s) ? t(`deliveryStatus.${s as (typeof DELIVERY_STATUSES)[number]}`) : s),
    pickupDate: (v: string) => pickupDateText(v, locale),
  };
}
