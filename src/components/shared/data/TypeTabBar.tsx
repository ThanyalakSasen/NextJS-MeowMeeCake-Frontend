"use client";
import { Segmented } from "antd";
/** แท็บ segmented กรองประเภท เช่น ทั้งหมด / พร้อมขาย / พรีออเดอร์ */
export function TypeTabBar<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Segmented
      value={value}
      onChange={(v) => onChange(v as T)}
      options={options.map((o) => ({ label: o.label, value: o.value }))}
      size="middle"
    />
  );
}
