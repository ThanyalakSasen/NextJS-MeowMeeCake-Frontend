"use client";
// แท็บ 3: ประวัติการผลิต — อ่านอย่างเดียว (สร้าง/แก้ที่แท็บแผน+สถานะ)
import type { Dayjs } from "dayjs";
import { useTranslations, useLocale } from "next-intl";
import { DatePicker } from "@/components/base";
import { StatCard, StatCardsGrid, BreakdownList } from "@/components/shared/stats";
import { DataTable, TypeTabBar, type Column } from "@/components/shared/data";
import { EmptyState } from "@/components/base";
import { formatDate } from "@/i18n/format";
import { pickerTypeFor, PERIOD_TYPES, type PeriodType } from "@/utils/period";
import type { ProductionOrder } from "@/types/productionOrder";
import type { useProductionViewModel } from "../useProductionViewModel";
import { durationHours, producedQty } from "../productionStatus";

type VM = ReturnType<typeof useProductionViewModel>;

// ตัวเลือกช่วงเวลา — แท็บ วัน/สัปดาห์/เดือน/ไตรมาส/ปี + DatePicker เหมือนหน้ารายงานยอดขาย (SalesReportView)
const PERIOD_LABEL_KEY: Record<PeriodType, "finance.periodDay" | "finance.periodWeek" | "finance.periodMonth" | "finance.periodQuarter" | "finance.periodYear"> = {
  day: "finance.periodDay",
  week: "finance.periodWeek",
  month: "finance.periodMonth",
  quarter: "finance.periodQuarter",
  year: "finance.periodYear",
};

// แบบเดิม (dropdown รายวัน/รายเดือน/รายปี เหนือตาราง) — เก็บไว้เผื่อกลับมาใช้ ดู JSX ที่คอมเมนต์ไว้ในตัวคอมโพเนนต์
// กลับมาใช้: เอาคอมเมนต์ออกทั้งสองที่ + import { Select } จาก "@/components/base" + import type { HistoryViewMode } จาก "../useProductionViewModel"
// + ลบแถว TypeTabBar ด้านบน
// (setHistoryViewMode รับ "day" | "month" | "year" ได้อยู่แล้ว — เป็นส่วนหนึ่งของ PeriodType)
// const VIEW_MODES: HistoryViewMode[] = ["day", "month", "year"];
// // antd DatePicker picker prop ใช้ชื่อเดียวกับ dayjs unit พอดี (day → "date")
// const PICKER_OF: Record<"day" | "month" | "year", "date" | "month" | "year"> = {
//   day: "date",
//   month: "month",
//   year: "year",
// };

export function HistoryTab(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<ProductionOrder>[] = [
    {
      key: "production_no",
      title: t("production.colNo"),
      render: (o) => <span className="font-medium text-brown-900 font-mono">{o.production_no}</span>,
    },
    {
      key: "items",
      title: t("production.colItems"),
      // ชื่อ × จำนวนที่ผลิตได้จริง · รายการที่ผลิตไม่ได้ (ยกเลิกตอนปิดงาน) ไม่แสดง
      render: (o) => (
        <span className="text-gray-700">
          {o.items.filter((it) => producedQty(it) > 0).map((it) => `${it.product_name} ×${producedQty(it)}`).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "completed_at",
      title: t("production.colCompletedAt"),
      render: (o) => <span className="text-gray-600">{o.completed_at ? formatDate(o.completed_at, locale, { withTime: true }) : "—"}</span>,
    },
    {
      key: "duration",
      title: t("production.colDuration"),
      render: (o) => {
        const d = durationHours(o);
        return <span className="text-gray-600">{d !== null ? t("production.hours", { n: d }) : "—"}</span>;
      },
    },
    {
      key: "assignee",
      title: t("production.fieldAssignee"),
      render: (o) => o.assignee_name ?? "—",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base text-gray-600">{t("production.historyDescription", { n: vm.historyStats.totalOrders })}</p>

      <div className="flex flex-wrap items-center gap-3">
        <TypeTabBar
          value={vm.historyViewMode}
          onChange={vm.setHistoryViewMode}
          options={PERIOD_TYPES.map((p) => ({ value: p, label: t(PERIOD_LABEL_KEY[p]) }))}
        />
        <DatePicker
          picker={pickerTypeFor(vm.historyViewMode)}
          value={vm.historyDate}
          onChange={(v) => { if (v && !Array.isArray(v)) vm.setHistoryDate(v as Dayjs); }}
          allowClear={false}
          style={{ width: 180 }}
          aria-label={t("filterLabel.period")}
        />
      </div>

      <StatCardsGrid cols={3}>
        <StatCard label={t("production.statTotalOrders")} value={vm.historyStats.totalOrders} sub={t("production.statTotalOrdersSub")} />
        <StatCard label={t("production.statTotalQty")} value={vm.historyStats.totalQty} sub={t("production.statTotalQtySub")} />
        <StatCard label={t("production.statAvgDuration")} value={t("production.hours", { n: vm.historyStats.avgDuration.toFixed(1) })} />
      </StatCardsGrid>

      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,1fr) 280px" }}>
        <div className="flex flex-col gap-3">
          {/* แบบเดิม — dropdown รายวัน/รายเดือน/รายปี เหนือตาราง (ดูวิธีกลับมาใช้ที่หัวไฟล์)
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={vm.historyViewMode}
              aria-label={t("filterLabel.period")}
              onChange={(v) => vm.setHistoryViewMode(v as HistoryViewMode)}
              options={VIEW_MODES.map((m) => ({ value: m, label: t(`production.viewMode.${m}`) }))}
              style={{ width: 130 }}
            />
            <DatePicker
              picker={PICKER_OF[vm.historyViewMode as "day" | "month" | "year"]}
              value={vm.historyDate}
              onChange={(d) => d && vm.setHistoryDate(d as Dayjs)}
              allowClear={false}
              style={{ width: 170 }}
            />
          </div>
          */}
          {vm.historyRows.length === 0 ? (
            <EmptyState description={t("production.historyEmpty")} />
          ) : (
            <DataTable columns={columns} rows={vm.historyRows} emptyText={t("production.historyEmpty")} />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <BreakdownList
            title={t("production.topProducts")}
            entries={vm.productBreakdown}
            emptyText={t("production.noData")}
            color="#f9a8d4"
          />
          <BreakdownList
            title={t("production.teamPerformance")}
            entries={vm.teamBreakdown}
            emptyText={t("production.noData")}
            color="#93c5fd"
          />
        </div>
      </div>
    </div>
  );
}
