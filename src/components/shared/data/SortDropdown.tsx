"use client";
import { Select } from "@/components/base";
/** เลือกการเรียงลำดับ — value = ค่า sort ที่ส่งให้ API (เช่น "-created_at") */
export function SortDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value}
      onChange={(v) => onChange(v as string)}
      options={options}
      style={{ width: 180 }}
      size="middle"
    />
  );
}
