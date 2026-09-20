"use client";
// การ์ด 1 แถวของ Sales Report — อันดับ + ชื่อสินค้า/หมวดหมู่ + แถบเทียบสัดส่วน + ค่า/หน่วยรอง
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency, formatNumber } from "@/i18n/format";
import type { SalesMode, ProductSalesStat } from "../salesReport";
import { valueOf, colorForCategory } from "../salesReport";

export function ProductBarRow({
  rank,
  row,
  mode,
  maxVal,
}: {
  rank: number;
  row: ProductSalesStat;
  mode: SalesMode;
  maxVal: number;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const value = valueOf(row, mode);
  const pct = maxVal > 0 ? Math.max((value / maxVal) * 100, 1.5) : 0;
  const color = colorForCategory(row.category_id);

  const valueLabel = mode === "revenue" ? formatCurrency(value, locale) : t("salesReport.qtyUnit", { n: formatNumber(value, locale) });
  const subLabel = mode === "revenue" ? t("salesReport.qtyUnit", { n: formatNumber(row.qty, locale) }) : formatCurrency(row.revenue, locale);

  return (
    <div className="grid items-center gap-2.5 py-2.5" style={{ gridTemplateColumns: "32px 160px 1fr 110px" }}>
      <span className="pr-1 text-right text-sm font-medium text-gray-300">{rank}</span>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-brown-800">{row.name}</p>
        <p className="truncate text-sm text-gray-400">{row.category_name || "—"}</p>
      </div>

      <div className="relative h-[14px] overflow-visible rounded bg-gray-100">
        <div className="absolute left-0 top-0 h-full rounded transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-brown-800">{valueLabel}</p>
        <p className="mt-0.5 text-xs text-gray-400">{subLabel}</p>
      </div>
    </div>
  );
}
