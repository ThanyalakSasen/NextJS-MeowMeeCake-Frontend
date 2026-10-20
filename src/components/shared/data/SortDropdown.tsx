"use client";
import { Select } from "@/components/base";
import { FilterField } from "./FilterField";
/** เลือกการเรียงลำดับ — value = ค่า sort ที่ส่งให้ API (เช่น "-created_at") · label = ป้ายเหนือช่อง (เช่น "เรียงตาม") */
export function SortDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FilterField label={label}>
      <Select
        value={value}
        onChange={(v) => onChange(v as string)}
        options={options}
        style={{ width: 180 }}
        size="middle"
      />
    </FilterField>
  );
}
