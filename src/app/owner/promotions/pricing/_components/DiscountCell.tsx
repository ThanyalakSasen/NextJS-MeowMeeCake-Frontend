"use client";
// ช่องส่วนลดแก้ได้ในตัว — เลือกประเภท % หรือ บาท ในช่องเดียวกัน เปลี่ยนค่าปุ๊บคำนวณราคาลดให้ทันที
// ไม่ต้องเปิด modal แยก (ไม่มี "แคมเปญส่วนลด" เก็บแยกใน backend อยู่แล้ว — ดู pricingHelpers.ts)
import { useTranslations } from "next-intl";
import { InputNumber, Select } from "@/components/base";
import type { Discount, DiscountType } from "../pricingHelpers";

export function DiscountCell({
  discount,
  highlight,
  onChange,
}: {
  discount: Discount | null;
  highlight?: boolean;
  onChange: (disc: Discount | null) => void;
}) {
  const t = useTranslations();
  const type = discount?.type ?? "percent";

  return (
    <div className="flex items-center gap-1">
      <Select
        value={type}
        size="small"
        style={{ width: 64 }}
        popupMatchSelectWidth={false}
        onChange={(nextType) => {
          // ยังไม่มีมูลค่า — แค่เปลี่ยนประเภทเฉย ๆ ไม่ต้องสร้างส่วนลดเปล่า
          if (discount) onChange({ ...discount, type: nextType as DiscountType });
        }}
        options={[
          { value: "percent", label: "%" },
          { value: "baht", label: t("common.currencySymbol") },
        ]}
      />
      <InputNumber
        size="small"
        min={0}
        max={type === "percent" ? 100 : undefined}
        value={discount?.value ?? null}
        placeholder="—"
        style={{ width: 70 }}
        className={highlight ? "!border-blue-400 !bg-blue-50" : undefined}
        onChange={(v) => onChange(v != null ? { type, value: Number(v) } : null)}
      />
    </div>
  );
}
