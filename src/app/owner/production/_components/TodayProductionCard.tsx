"use client";
// วันนี้ผลิตอะไรบ้าง — สรุปจำนวนต่อสินค้าจากใบสั่งผลิตที่วันผลิตตรงวันนี้ (หัวแท็บแผนการผลิต)
// แสดงอย่างเดียว ไม่มีปุ่ม (ผู้ใช้ขอ 2026-10-29 — ไม่เลื่อนสถานะการผลิตจากหน้านี้) · ข้อมูลจาก useProductionViewModel.todayItems
import { useTranslations, useLocale } from "next-intl";
import { Card, EmptyState } from "@/components/base";
import { formatDate, formatNumber } from "@/i18n/format";
import type { useProductionViewModel } from "../useProductionViewModel";

type VM = ReturnType<typeof useProductionViewModel>;

export function TodayProductionCard({ today, todayItems, todayOrderCount }: Pick<VM, "today" | "todayItems" | "todayOrderCount">) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="m-0 text-base font-semibold text-brown-900">
          {t("production.todayTitle", { date: formatDate(today.toISOString(), locale) })}
        </p>
        {todayOrderCount > 0 && (
          <p className="m-0 text-sm text-gray-500">{t("production.todayOrderCount", { n: todayOrderCount })}</p>
        )}
      </div>
      {todayItems.length === 0 ? (
        <EmptyState description={t("production.todayEmpty")} className="py-4" />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {todayItems.map((it) => (
            <li key={it.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
              <div className="min-w-0">
                <p className="m-0 truncate text-sm text-gray-800">{it.name}</p>
                <p className="m-0 truncate font-mono text-xs text-gray-500">{it.orderNos.join(", ")}</p>
              </div>
              <p className="m-0 shrink-0 text-sm font-semibold text-brown-900">
                {formatNumber(it.qty, locale)} {it.unit}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
