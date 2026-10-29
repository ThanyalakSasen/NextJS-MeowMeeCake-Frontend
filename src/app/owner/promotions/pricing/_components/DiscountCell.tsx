"use client";
// ช่องส่วนลดแก้ได้ในตัว — เปอร์เซ็นต์อย่างเดียว เปลี่ยนค่าปุ๊บคำนวณราคาลดให้ทันที
// ไม่ต้องเปิด modal แยก (ไม่มี "แคมเปญส่วนลด" เก็บแยกใน backend อยู่แล้ว — ดู pricingHelpers.ts)
// ลดเป็นบาท = แก้ช่อง "ราคาลด (บาท)" ตรง ๆ
import { useTranslations } from "next-intl";
import { InputNumber } from "@/components/base";

export function DiscountCell({
  percent,
  highlight,
  onChange,
}: {
  percent: number | null;
  highlight?: boolean;
  onChange: (percent: number | null) => void;
}) {
  const t = useTranslations();

  return (
    <InputNumber precision={0}
      size="small"
      min={0}
      max={100}
      aria-label={t("pricing.colDiscount")}
      value={percent}
      placeholder="—"
      suffix="%"
      style={{ width: 90 }}
      className={highlight ? "!border-blue-400 !bg-blue-50" : undefined}
      onChange={(v) => onChange(v != null ? Number(v) : null)}
    />
  );
}
