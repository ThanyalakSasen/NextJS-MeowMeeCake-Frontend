"use client";
import { Empty } from "antd";
import { useTranslations } from "next-intl";

/** แสดงเมื่อไม่มีข้อมูล — antd Empty + ข้อความ i18n (ค่าเริ่มต้น = common.noData) */
export function EmptyState({ description, className = "py-10" }: { description?: string; className?: string }) {
  const t = useTranslations("common");
  return (
    <div className={className}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description ?? t("noData")} />
    </div>
  );
}
