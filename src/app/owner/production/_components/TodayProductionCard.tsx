"use client";
// วันนี้ผลิตอะไรบ้าง — ใบสั่งผลิตที่วันผลิตตรงวันนี้ แยกเป็นการ์ดต่อใบ (สินค้าในใบนั้น + จำนวน) ให้เห็นว่าสินค้าไหนอยู่ใบไหน
// หัวการ์ดสรุปจำนวนใบ/สินค้าทั้งวัน · กดการ์ดใบ = เปิดรายละเอียดใบนั้น (แบบเดียวกับกดแถวในตาราง)
// แสดงอย่างเดียว ไม่มีปุ่มเลื่อนสถานะ (ผู้ใช้ขอ 2026-10-29) · ข้อมูลจาก useProductionViewModel.todayOrders / todayItems
import { useTranslations, useLocale } from "next-intl";
import { Card, EmptyState, Tag } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { formatDate, formatNumber } from "@/i18n/format";
import { SOURCE_TYPE_CONFIG } from "@/constants/enumConfig";
import type { ProductionOrder } from "@/types/productionOrder";
import type { useProductionViewModel } from "../useProductionViewModel";

type VM = ReturnType<typeof useProductionViewModel>;

export function TodayProductionCard({
  today,
  todayItems,
  todayOrders,
  onView,
}: Pick<VM, "today" | "todayItems" | "todayOrders"> & { onView: (o: ProductionOrder) => void }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 text-base font-semibold text-brown-900">
          {t("production.todayTitle", { date: formatDate(today.toISOString(), locale) })}
        </h3>
        {todayOrders.length > 0 && (
          <p className="m-0 text-sm text-gray-500">
            {t("production.todayOrderCount", { n: todayOrders.length })} · {t("production.todayProductCount", { n: todayItems.length })}
          </p>
        )}
      </div>

      {todayOrders.length === 0 ? (
        <EmptyState description={t("production.todayEmpty")} className="py-4" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {todayOrders.map((o) => {
            const src = SOURCE_TYPE_CONFIG[o.source_type];
            return (
              <button
                key={o._id}
                type="button"
                onClick={() => onView(o)}
                className="flex cursor-pointer flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-brown-400 hover:bg-brown-50/40"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 truncate font-mono text-sm font-semibold text-brown-900">{o.production_no}</p>
                    <p className="m-0 mt-0.5 truncate text-xs text-gray-500">
                      {t("production.fieldAssignee")}: {o.assignee_name ?? t("production.unassigned")}
                    </p>
                  </div>
                  <StatusBadge group="productionStatus" value={o.production_status} />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag style={{ background: src.bg, color: src.color, borderColor: "transparent" }} className="!m-0">
                    {t(`enums.sourceType.${o.source_type}`)}
                  </Tag>
                  {o.round_name && <span className="truncate text-xs text-gray-600">{o.round_name}</span>}
                  <span className="ml-auto text-xs text-gray-500">{t("production.itemsCount", { n: o.items.length })}</span>
                </div>

                <ul className="m-0 flex w-full list-none flex-col divide-y divide-gray-100 rounded-lg bg-gray-50 p-0">
                  {o.items.map((it) => (
                    <li key={it._id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="min-w-0 truncate text-sm text-gray-800">{it.product_name}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-brown-900">
                        {formatNumber(it.planned_qty, locale)} {it.unit_abbr}
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
