"use client";
// แท็บ 3: ประวัติการผลิต — อ่านอย่างเดียว (สร้าง/แก้ที่แท็บแผน+สถานะ)
import { useTranslations, useLocale } from "next-intl";
import { Select } from "@/components/base";
import { StatCard, StatCardsGrid, BreakdownList } from "@/components/shared/stats";
import { DataTable, type Column } from "@/components/shared/data";
import { EmptyState } from "@/components/base";
import { formatDate } from "@/i18n/format";
import type { ProductionOrder } from "@/types/productionOrder";
import type { useProductionViewModel } from "../useProductionViewModel";
import { durationHours } from "../productionStatus";

type VM = ReturnType<typeof useProductionViewModel>;

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
      render: (o) => <span className="text-gray-700">{o.items.map((it) => it.product_name).join(", ")}</span>,
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

      <StatCardsGrid>
        <StatCard label={t("production.statTotalOrders")} value={vm.historyStats.totalOrders} sub={t("production.statTotalOrdersSub")} />
        <StatCard label={t("production.statTotalQty")} value={vm.historyStats.totalQty} sub={t("production.statTotalQtySub")} />
        <StatCard label={t("production.statAvgDuration")} value={t("production.hours", { n: vm.historyStats.avgDuration.toFixed(1) })} />
      </StatCardsGrid>

      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,1fr) 280px" }}>
        <div className="flex flex-col gap-3">
          <Select
            value={vm.selectedMonth}
            onChange={vm.setSelectedMonth}
            options={vm.monthOptions}
            style={{ width: 200 }}
          />
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
