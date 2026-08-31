"use client";
import { Spin } from "antd";
import { useTranslations } from "next-intl";
/** สถานะกำลังโหลด กลาง — ใช้แทนข้อความ loading เปล่า ๆ ทั่วทุกหน้า */
export function LoadingSpin({ text, className = "py-16" }: { text?: string; className?: string }) {
  const t = useTranslations("common");
  return (
    <div className={`${className} flex flex-col items-center justify-center gap-2.5 text-sm text-gray-400`}>
      <Spin size="large" />
      <span>{text ?? t("loading")}</span>
    </div>
  );
}
