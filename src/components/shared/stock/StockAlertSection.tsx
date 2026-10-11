"use client";
// ─────────────────────────────────────────────────────────────
// StockAlertSection — กล่อง "ใกล้หมด / หมดสต็อก" เหนือตารางหลักของหน้าสต็อกวัตถุดิบและสต็อกสินค้า
// ผู้เรียกไม่ render เลยเมื่อไม่มีรายการ (ไม่มีกล่องว่าง) · ตารางข้างในใช้ DataTable inCard (ไม่มีกรอบซ้อน)
// ─────────────────────────────────────────────────────────────
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function StockAlertSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-rose-200 bg-white">
      <div className="flex items-start gap-2.5 border-b border-rose-100 bg-rose-50 px-5 py-3">
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
        <div>
          <h2 className="m-0 text-base font-semibold text-rose-700">{title}</h2>
          {description && <p className="m-0 mt-0.5 text-sm text-rose-700/80">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
