"use client";
// ─────────────────────────────────────────────────────────────
// StatusFilterSelect — ช่องกรองสถานะในแถบ FilterToolbar
//
// เดิมหน้าวัตถุดิบ · สต็อกวัตถุดิบ · สต็อกสินค้า เขียน <div style={{minWidth:150}}><Select .../></div>
// เหมือนกันทุกตัวอักษร พร้อมอาร์เรย์ statusOptions ชุดเดียวกัน (CONSISTENCY_AUDIT ข้อ 3.14 A3)
//
//   <StatusFilterSelect label={t("filterLabel.status")} value={vm.status} onChange={vm.setStatus} options={useStockStatusOptions()} />
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { Select } from "@/components/base";
import { FilterField } from "./FilterField";

export interface FilterOption {
  value: string;
  label: string;
}

export function StatusFilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  minWidth = 150,
}: {
  /** ป้ายเหนือช่อง — บอกว่ากรองอะไร */
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: FilterOption[];
  minWidth?: number;
}) {
  return (
    <FilterField label={label} minWidth={minWidth}>
      <Select value={value} onChange={(v) => onChange(v as T)} options={options} />
    </FilterField>
  );
}

/** ตัวเลือกสถานะสต็อก (ทั้งหมด / ปกติ / ใกล้หมด / หมด) — ใช้ร่วม 3 หน้าสต็อก */
export function useStockStatusOptions(): FilterOption[] {
  const t = useTranslations();
  return [
    { value: "all", label: t("common.all") },
    { value: "ok", label: t("enums.stockStatus.ok") },
    { value: "low", label: t("enums.stockStatus.low") },
    { value: "out", label: t("enums.stockStatus.out") },
  ];
}
