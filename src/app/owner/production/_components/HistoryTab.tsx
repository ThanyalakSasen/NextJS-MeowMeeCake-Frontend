"use client";
// แท็บ 3: ประวัติการผลิต — อ่านอย่างเดียว (สร้าง/แก้ที่แท็บแผน+สถานะ) · ทุกใบตั้งแต่สร้าง พร้อมป้ายสถานะ
// รายการสินค้าของแต่ละใบไม่อยู่ในตาราง — กด "ดู" เปิดป๊อปอัปรายละเอียด (ProductionOrderDetail) ที่ลิสต์ครบทุกรายการ
import { useTranslations, useLocale } from "next-intl";
import { StatCard, StatCardsGrid, BreakdownList } from "@/components/shared/stats";
import { DataTable, PeriodSelector, type Column } from "@/components/shared/data";
import { EmptyState } from "@/components/base";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { formatDate } from "@/i18n/format";
import { ViewButton } from "@/components/shared/actions";
import type { ProductionOrder } from "@/types/productionOrder";
import type { useProductionViewModel } from "../useProductionViewModel";
import { PrintLotLabelsButton } from "./PrintLotLabelsButton";

type VM = ReturnType<typeof useProductionViewModel>;

// แบบเดิม (dropdown รายวัน/รายเดือน/รายปี เหนือตาราง) — เก็บไว้เผื่อกลับมาใช้ ดู JSX ที่คอมเมนต์ไว้ในตัวคอมโพเนนต์
// กลับมาใช้: เอาคอมเมนต์ออกทั้งสองที่ + import { Select, DatePicker } จาก "@/components/base" + import type { Dayjs } จาก "dayjs" + import type { HistoryViewMode } จาก "../useProductionViewModel"
// + ลบแถว PeriodSelector ด้านบน
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
      key: "production_date",
      title: t("production.fieldDate"),
      render: (o) => <span className="text-gray-600">{formatDate(o.production_date, locale)}</span>,
    },
    // คอลัมน์ "สถานะ" + "เสร็จเมื่อ" เอาออก — ไม่มีขั้นอัปเดตสถานะการผลิตแล้ว · สถานะ/เวลาปิดงานยังดูได้ในป๊อปอัปรายละเอียด
    {
      key: "assignee",
      title: t("production.fieldAssignee"),
      render: (o) => o.assignee_name ?? "—",
    },
    {
      // ล็อตสร้างตอนปิดงานผลิต — ใบที่ยังไม่เสร็จไม่มีฉลากให้พิมพ์
      key: "lot_labels",
      title: t("production.colLotLabels"),
      render: (o) => (o.production_status === "done" ? <PrintLotLabelsButton orderId={o._id} /> : <span className="text-gray-500">—</span>),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base text-gray-600">{t("production.historyDescription", { n: vm.historyStats.allOrders, done: vm.historyStats.totalOrders })}</p>

      <div className="flex flex-wrap items-center gap-3">
        <PeriodSelector period={vm.historyViewMode} onPeriodChange={vm.setHistoryViewMode} date={vm.historyDate} onDateChange={vm.setHistoryDate} />
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
          {vm.historyError ? (
            <LoadFailed onRetry={vm.refetchHistory} />
          ) : vm.historyLoading ? (
            <LoadingSpin />
          ) : vm.historyRows.length === 0 ? (
            <EmptyState description={t("production.historyEmpty")} />
          ) : (
            <DataTable
              columns={columns}
              rows={vm.historyRows}
              emptyText={t("production.historyEmpty")}
              onRowClick={vm.onView}
              actions={(o) => <ViewButton size="small" onClick={() => vm.onView(o)} />}
            />
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
