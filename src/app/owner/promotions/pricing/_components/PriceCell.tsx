"use client";
// ช่องราคาแก้ได้ในตัว — ใช้ทั้งราคาปกติและราคาลด
import { useTranslations } from "next-intl";
import { InputNumber } from "@/components/base";

export function PriceCell({
  value,
  onChange,
  highlight,
  invalid,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  highlight?: boolean;
  /** ราคาในแถวนี้บันทึกไม่ได้ — กรอบแดง */
  invalid?: boolean;
  /** ชื่อช่องสำหรับ screen reader (ไม่มี label ที่มองเห็นต่อช่อง — หัวคอลัมน์อยู่ไกล) */
  ariaLabel: string;
}) {
  const t = useTranslations();
  return (
    <InputNumber precision={0}
      value={value}
      aria-label={ariaLabel}
      onChange={(v) => onChange(v != null ? Number(v) : null)}
      min={0}
      status={invalid ? "error" : undefined}
      prefix={t("common.currencySymbol")}
      placeholder="—"
      size="small"
      style={{ width: 120 }}
      className={highlight && !invalid ? "!border-blue-400 !bg-blue-50" : undefined}
    />
  );
}
