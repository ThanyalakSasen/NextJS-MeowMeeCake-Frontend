"use client";
import { Segmented } from "antd";
import { useTranslations } from "next-intl";
import { Squares2X2Icon, TableCellsIcon } from "@heroicons/react/24/outline";
/** สลับมุมมอง Grid / Table — ปุ่มเป็นไอคอนล้วน จึงใส่ชื่อแบบซ่อน (sr-only) ให้ screen reader / Lighthouse a11y */
export function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "table";
  onChange: (v: "grid" | "table") => void;
}) {
  const t = useTranslations();
  return (
    <Segmented
      value={value}
      onChange={(v) => onChange(v as "grid" | "table")}
      options={[
        { value: "grid", icon: <Squares2X2Icon className="w-4 h-4" aria-hidden />, label: <span className="sr-only">{t("common.viewGrid")}</span>, title: t("common.viewGrid") },
        { value: "table", icon: <TableCellsIcon className="w-4 h-4" aria-hidden />, label: <span className="sr-only">{t("common.viewTable")}</span>, title: t("common.viewTable") },
      ]}
    />
  );
}
