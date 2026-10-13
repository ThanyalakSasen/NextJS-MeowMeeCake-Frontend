"use client";
// ─────────────────────────────────────────────────────────────
// FilterField — ป้ายกำกับเล็กเหนือ dropdown (แบบหน้าสต็อกสินค้า) ให้รู้ว่าช่องนี้กรอง/เลือกอะไร
// ไม่งั้นช่องโชว์แค่ค่าที่เลือก เช่น "ทั้งหมด" ซึ่งดูไม่ออกว่าเป็นตัวกรองอะไร
// ใส่ aria-label = ป้ายเดียวกันให้ control ข้างใน (antd Select ส่ง aria-* ต่อให้ช่อง input) — screen reader อ่านชื่อได้
// ใช้ <div> ไม่ใช่ <label> — antd Select ใน <label> คลิกแล้วเปิด-ปิดซ้อนกัน
//
//   <FilterField label={t("employees.colRole")} minWidth={160}><Select ... /></FilterField>
// ─────────────────────────────────────────────────────────────
import { cloneElement, isValidElement } from "react";

export function FilterField({
  label,
  minWidth,
  className = "",
  children,
}: {
  label: string;
  minWidth?: number;
  className?: string;
  children: React.ReactElement<{ "aria-label"?: string }>;
}) {
  const control = isValidElement(children) && !children.props["aria-label"] ? cloneElement(children, { "aria-label": label }) : children;
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`} style={minWidth ? { minWidth } : undefined}>
      <span className="text-xs text-gray-500">{label}</span>
      {control}
    </div>
  );
}
