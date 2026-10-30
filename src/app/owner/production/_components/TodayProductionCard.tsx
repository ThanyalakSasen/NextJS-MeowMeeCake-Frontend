"use client";
// วันนี้ผลิตอะไรบ้าง — ใบที่ยังไม่ปิดงานของวันนี้ + ที่ค้างจากวันก่อน (ป้าย "ค้างจาก …") แยกเป็นการ์ดต่อใบ (สินค้าในใบนั้น + จำนวน) ให้เห็นว่าสินค้าไหนอยู่ใบไหน
// หัวการ์ดสรุปจำนวนใบ/สินค้าทั้งวัน · กดการ์ดใบ = เปิดรายละเอียดใบนั้น (แบบเดียวกับกดแถวในตาราง)
// ปุ่มท้ายการ์ด: รอดำเนินการ = "เริ่มการผลิต" · กำลังผลิต = "ผลิตเรียบร้อย" (เปิดหน้าต่างปิดงาน) (ผู้ใช้ขอ 2026-10-30) · ข้อมูลจาก useProductionViewModel.todayOrders / todayItems
// ปุ่มชิดล่างการ์ดเสมอ (mt-auto — การ์ดในแถวเดียวกันสูงเท่ากัน ปุ่มจึงเรียงแนวเดียวกัน) · การ์ดเป็น div role="button" (ไม่ใช่ <button>) เพราะมีปุ่มซ้อนข้างใน — ปุ่มเริ่มผลิต stopPropagation ไม่ให้เปิดป๊อปอัป
// ใบที่มีสินค้าเกิน 3 รายการ แสดงแค่ 3 รายการแรก + "ดูเพิ่มเติมอีก n รายการ" (กดการ์ด = เปิดรายละเอียดเต็ม) — การ์ดสูงไม่ต่างกันมาก (ผู้ใช้ขอ 2026-10-30)
import { useTranslations, useLocale } from "next-intl";
import dayjs from "dayjs";
import { Button, Card, EmptyState, Tag } from "@/components/base";
import { actionIcon } from "@/components/shared/actions";
import { StatusBadge } from "@/components/shared/stats";
import { formatDate, formatNumber } from "@/i18n/format";
import { SOURCE_TYPE_CONFIG } from "@/constants/enumConfig";
import type { ProductionOrder } from "@/types/productionOrder";
import type { useProductionViewModel } from "../useProductionViewModel";

type VM = ReturnType<typeof useProductionViewModel>;

const MAX_ITEMS = 3;

export function TodayProductionCard({
  today,
  todayItems,
  todayOrders,
  onView,
  canStart,
  onStart,
  startingId,
  canFinish,
  onFinish,
}: Pick<VM, "today" | "todayItems" | "todayOrders"> & {
  onView: (o: ProductionOrder) => void;
  /** สิทธิ์ production.update — ปุ่มเริ่มการผลิตของใบรอดำเนินการ */
  canStart: boolean;
  onStart: (o: ProductionOrder) => void;
  startingId: string | null;
  /** สิทธิ์ production.approve — ปุ่มผลิตเรียบร้อยของใบกำลังผลิต (เปิดหน้าต่างปิดงาน) */
  canFinish: boolean;
  onFinish: (o: ProductionOrder) => void;
}) {
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
            const hidden = o.items.length - MAX_ITEMS;
            const carried = dayjs(o.production_date).isBefore(today, "day");
            return (
              <div
                key={o._id}
                role="button"
                tabIndex={0}
                onClick={() => onView(o)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onView(o);
                  }
                }}
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
                  {carried && (
                    <Tag color="warning" className="!m-0">
                      {t("production.todayCarriedOver", { date: formatDate(o.production_date, locale) })}
                    </Tag>
                  )}
                  <span className="ml-auto text-xs text-gray-500">{t("production.itemsCount", { n: o.items.length })}</span>
                </div>

                <ul className="m-0 flex w-full list-none flex-col divide-y divide-gray-100 rounded-lg bg-gray-50 p-0">
                  {o.items.slice(0, MAX_ITEMS).map((it) => (
                    <li key={it._id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="min-w-0 truncate text-sm text-gray-800">{it.product_name}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-brown-900">
                        {formatNumber(it.planned_qty, locale)} {it.unit_abbr}
                      </span>
                    </li>
                  ))}
                  {hidden > 0 && (
                    <li className="px-3 py-2 text-center text-xs font-medium text-brown-700">
                      {t("production.todayMoreItems", { n: hidden })}
                    </li>
                  )}
                </ul>

                {canStart && o.production_status === "planned" && (
                  <Button
                    type="primary"
                    size="small"
                    block
                    className="!mt-auto"
                    icon={actionIcon("next", "small")}
                    loading={startingId === o._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart(o);
                    }}
                  >
                    {t("production.startOrder")}
                  </Button>
                )}
                {canFinish && o.production_status === "in_progress" && (
                  <Button
                    type="primary"
                    size="small"
                    block
                    className="!mt-auto"
                    icon={actionIcon("confirm", "small")}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFinish(o);
                    }}
                  >
                    {t("production.finishOrder")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
