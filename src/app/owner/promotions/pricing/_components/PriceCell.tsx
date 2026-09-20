"use client";
// ช่องราคาแก้ได้ในตัว — ใช้ทั้งราคาปกติและราคาลด
import { useTranslations } from "next-intl";
import { InputNumber } from "@/components/base";

export function PriceCell({
  value,
  onChange,
  highlight,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  highlight?: boolean;
}) {
  const t = useTranslations();
  return (
    <InputNumber
      value={value}
      onChange={(v) => onChange(v != null ? Number(v) : null)}
      min={0}
      prefix={t("common.currencySymbol")}
      placeholder="—"
      size="small"
      style={{ width: 120 }}
      className={highlight ? "!border-blue-400 !bg-blue-50" : undefined}
    />
  );
}
