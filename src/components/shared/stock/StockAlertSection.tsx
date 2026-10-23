"use client";
// ─────────────────────────────────────────────────────────────
// StockAlertSection — กล่อง "ใกล้หมด / หมดสต็อก" เหนือตารางหลักของหน้าสต็อกวัตถุดิบและสต็อกสินค้า
// หน้าจัดการคำสั่งซื้อใช้แบบเดียวกัน (ยังไม่จัดส่ง / รอยืนยันการชำระเงิน / ยังไม่แนบสลิป) — tone แยกสีแต่ละกล่อง
// ผู้เรียกไม่ render เลยเมื่อไม่มีรายการ (ไม่มีกล่องว่าง) · ตารางข้างในใช้ DataTable inCard (ไม่มีกรอบซ้อน)
// ─────────────────────────────────────────────────────────────
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export type AlertTone = "danger" | "warn" | "info";

const TONE: Record<AlertTone, { box: string; head: string; icon: string; text: string }> = {
  danger: { box: "border-rose-200", head: "border-rose-100 bg-rose-50", icon: "text-rose-600", text: "text-rose-700" },
  warn: { box: "border-amber-200", head: "border-amber-100 bg-amber-50", icon: "text-amber-600", text: "text-amber-800" },
  info: { box: "border-sky-200", head: "border-sky-100 bg-sky-50", icon: "text-sky-600", text: "text-sky-800" },
};

export function StockAlertSection({
  title,
  description,
  tone = "danger",
  children,
}: {
  title: string;
  description?: string;
  tone?: AlertTone;
  children: React.ReactNode;
}) {
  const c = TONE[tone];
  return (
    <section className={`overflow-hidden rounded-xl border bg-white ${c.box}`}>
      <div className={`flex items-start gap-2.5 border-b px-5 py-3 ${c.head}`}>
        <ExclamationTriangleIcon className={`mt-0.5 h-5 w-5 shrink-0 ${c.icon}`} aria-hidden="true" />
        <div>
          <h2 className={`m-0 text-base font-semibold ${c.text}`}>{title}</h2>
          {description && <p className={`m-0 mt-0.5 text-sm ${c.text}`}>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
