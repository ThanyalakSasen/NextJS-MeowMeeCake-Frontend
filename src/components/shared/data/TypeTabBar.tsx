"use client";
import { startTransition, useState } from "react";
import { Segmented } from "antd";

/**
 * แท็บ segmented กรองประเภท เช่น ทั้งหมด / พร้อมขาย / พรีออเดอร์
 *
 * กดแล้วแถบเลื่อนทันที (state ในตัว) แต่ส่ง onChange ใน startTransition — เนื้อหาแท็บใหม่ (ตาราง/ฟอร์ม/chunk ที่โหลด
 * ทีหลัง) render แบบแบ่งช่วงได้ ไม่เป็นงานก้อนเดียวยาวหลายร้อย ms (Lighthouse TBT ตอนสลับแท็บ · มือถือ 4x)
 * เดิม MotionThumb ของ Segmented วัดตำแหน่งใน layout effect หลัง commit เนื้อหาใหม่ = บังคับ layout ทั้งหน้าในงานนั้นด้วย
 */
export function TypeTabBar<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  // ค่าที่กดแล้วแต่ parent ยังไม่ commit — ล้างพร้อมกับ transition เดียวกัน (ไม่ค้างถ้า parent เปลี่ยนค่าเอง)
  const [pending, setPending] = useState<T | null>(null);

  return (
    <Segmented
      value={pending ?? value}
      onChange={(v) => {
        setPending(v as T);
        startTransition(() => {
          onChange(v as T);
          setPending(null);
        });
      }}
      options={options.map((o) => ({ label: o.label, value: o.value }))}
      size="middle"
    />
  );
}
