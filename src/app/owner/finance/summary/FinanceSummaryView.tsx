"use client";
// View ของ Finance P&L — JSX ล้วน รับ props จาก useFinanceSummaryViewModel
import { useTranslations, useLocale } from "next-intl";
import { DatePicker, EmptyState } from "@/components/base";
import { DashboardPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { DataTable, TypeTabBar, type Column } from "@/components/shared/data";
import { LoadingSpin } from "@/components/shared/feedback";
import { formatCurrency } from "@/i18n/format";
import type { useFinanceSummaryViewModel } from "./useFinanceSummaryViewModel";
import { pickerTypeFor, PERIOD_TYPES, type PeriodType } from "@/utils/period";
import { PLStatementTable } from "./_components/PLStatementTable";

type VM = ReturnType<typeof useFinanceSummaryViewModel>;
type TrendRow = VM["monthlyTrend"][number];

const PERIOD_LABEL_KEY: Record<PeriodType, "finance.periodDay" | "finance.periodWeek" | "finance.periodMonth" | "finance.periodQuarter" | "finance.periodYear"> = {
  day: "finance.periodDay",
  week: "finance.periodWeek",
  month: "finance.periodMonth",
  quarter: "finance.periodQuarter",
  year: "finance.periodYear",
};

export function FinanceSummaryView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const trendColumns: Column<TrendRow>[] = [
    { key: "label", title: t("finance.trendColMonth") },
    { key: "income", title: t("finance.trendColIncome"), align: "right", render: (r) => <span className="text-green-600">{formatCurrency(r.income, locale)}</span> },
    { key: "expense", title: t("finance.trendColExpense"), align: "right", render: (r) => <span className="text-red-500">{formatCurrency(r.expense, locale)}</span> },
    { key: "profit", title: t("finance.trendColProfit"), align: "right", render: (r) => <span className={r.profit >= 0 ? "font-semibold text-blue-700" : "font-semibold text-red-500"}>{formatCurrency(r.profit, locale)}</span> },
  ];

  return (
    <DashboardPageLayout title={t("finance.summaryTitle")}>
      <div className="flex flex-wrap items-center gap-3">
        <TypeTabBar
          value={vm.period}
          onChange={vm.setPeriod}
          options={PERIOD_TYPES.map((p) => ({ value: p, label: t(PERIOD_LABEL_KEY[p]) }))}
        />
        <DatePicker
          picker={pickerTypeFor(vm.period)}
          value={vm.selectedDate}
          onChange={(v) => { if (v && !Array.isArray(v)) vm.setSelectedDate(v); }}
          style={{ width: 180 }}
        />
      </div>

      {vm.isLoading ? (
        <LoadingSpin />
      ) : !vm.hasData ? (
        <EmptyState description={t("finance.noDataThisPeriod")} />
      ) : (
        <>
          {/* แถว 1: สรุป 3 ค่า แบ่งเต็มแถวเท่ากัน */}
          <StatCardsGrid cols={3}>
            <StatCard label={t("finance.heroIncome")} value={formatCurrency(vm.totalIncome, locale)} sub={t("finance.heroIncomeSub", { n: vm.orderCount, period: vm.periodLabel })} tone="up" />
            <StatCard
              label={t("finance.heroExpense")}
              value={formatCurrency(vm.totalCogs + vm.totalOpex, locale)}
              sub={t("finance.heroExpenseSub", { cogs: formatCurrency(vm.totalCogs, locale), opex: formatCurrency(vm.totalOpex, locale) })}
              tone="down"
            />
            <StatCard
              label={vm.netProfit >= 0 ? t("finance.heroNet") : t("finance.heroNetLoss")}
              value={
                <span className={vm.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(vm.netProfit, locale)}
                </span>
              }
              sub={vm.totalIncome > 0 ? t("finance.profitMargin", { pct: ((vm.netProfit / vm.totalIncome) * 100).toFixed(1) }) : "—"}
              tone={vm.netProfit >= 0 ? "up" : "down"}
            />
          </StatCardsGrid>

          {/* แถว 2: grid 3 คอลัมน์ + gap เดียวกับแถว 1 — ตารางเปรียบเทียบกิน 2 คอลัมน์ งบกำไร-ขาดทุน 1 คอลัมน์
              (ขอบตรงกับการ์ดสรุปด้านบน) · ไม่ใส่ items-start → 2 การ์ดยืดสูงเท่ากันตามใบที่สูงกว่า · จอเล็กซ้อนคอลัมน์เดียว */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white lg:col-span-2">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-brown-900">{t("finance.trendTitle")}</p>
              </div>
              <DataTable inCard columns={trendColumns} rows={vm.monthlyTrend} />
            </div>

            <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-brown-900">{t("finance.statementTitle")}</p>
                <span className="text-sm text-gray-400">{vm.periodLabel}</span>
              </div>
              <PLStatementTable rows={vm.pnlRows} />
              {/* mt-auto: หมายเหตุชิดล่างเสมอ ถ้าการ์ดถูกยืดตามตารางเปรียบเทียบที่ยาวกว่า */}
              <p className="mx-4 mb-3 mt-auto rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {t("finance.cogsNote")}
              </p>
            </div>
          </div>

          {/* แถว 3: KPI กว้างเต็มแถว — 4 ค่าเรียงแนวนอน (จอเล็ก 2×2) */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-brown-900">{t("finance.kpiTitle")}</p>
            </div>
            <div className="grid grid-cols-2 divide-gray-100 lg:grid-cols-4 lg:divide-x">
              {vm.kpis.map((kpi) => (
                <div key={kpi.key} className="flex flex-col gap-1 px-4 py-3">
                  <span className="text-sm text-gray-500">{kpi.label}</span>
                  <span className="text-base font-bold text-brown-900">{kpi.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardPageLayout>
  );
}
