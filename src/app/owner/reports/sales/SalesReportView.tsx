"use client";
// View ของ Sales Report — JSX ล้วน รับ props จาก useSalesReportViewModel
import { useTranslations, useLocale } from "next-intl";
import { DatePicker, EmptyState } from "@/components/base";
import { DashboardPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { TypeTabBar, SortDropdown } from "@/components/shared/data";
import { LoadingSpin } from "@/components/shared/feedback";
import { formatCurrency, formatNumber } from "@/i18n/format";
import { pickerTypeFor, PERIOD_TYPES, type PeriodType } from "@/utils/period";
import type { useSalesReportViewModel } from "./useSalesReportViewModel";
import { CATEGORY_ALL, colorForCategory, type SalesMode } from "./salesReport";
import { ProductBarRow } from "./_components/ProductBarRow";

type VM = ReturnType<typeof useSalesReportViewModel>;

const PERIOD_LABEL_KEY: Record<PeriodType, "finance.periodDay" | "finance.periodWeek" | "finance.periodMonth" | "finance.periodQuarter" | "finance.periodYear"> = {
  day: "finance.periodDay",
  week: "finance.periodWeek",
  month: "finance.periodMonth",
  quarter: "finance.periodQuarter",
  year: "finance.periodYear",
};

export function SalesReportView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <DashboardPageLayout title={t("salesReport.title")} description={t("salesReport.description")}>
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
        <div className="flex-1" />
        <TypeTabBar<SalesMode>
          value={vm.mode}
          onChange={vm.setMode}
          options={[
            { value: "revenue", label: t("salesReport.modeRevenue") },
            { value: "qty", label: t("salesReport.modeQty") },
          ]}
        />
      </div>

      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
        </div>
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <>
          <StatCardsGrid>
            <StatCard
              label={t("salesReport.statRevenue")}
              value={formatCurrency(vm.totalRevenue, locale)}
              sub={t("salesReport.statRevenueSub", { n: vm.rows.length })}
            />
            <StatCard
              label={t("salesReport.statQty")}
              value={formatNumber(vm.totalQty, locale)}
              sub={t("salesReport.statQtySub")}
            />
            <StatCard
              label={t("salesReport.statTop")}
              value={vm.topProduct?.name ?? "—"}
              sub={vm.topProduct ? vm.topProduct.category_name : ""}
              tone="up"
            />
          </StatCardsGrid>

          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <TypeTabBar
                  value={vm.categoryId}
                  onChange={vm.setCategoryId}
                  options={[
                    { value: CATEGORY_ALL, label: t("salesReport.categoryAll") },
                    ...vm.categories,
                  ]}
                />
                <div className="flex-1" />
                <SortDropdown
                  value={vm.sort}
                  onChange={(v) => vm.setSort(v as VM["sort"])}
                  options={[
                    { value: "desc", label: t("salesReport.sortDesc") },
                    { value: "asc", label: t("salesReport.sortAsc") },
                  ]}
                />
              </div>

              {vm.categories.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-4">
                  {vm.categories.map((c) => (
                    <div key={c.value} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: colorForCategory(c.value) }} />
                      <span className="text-sm text-gray-500">{c.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {vm.rows.length === 0 ? (
                <EmptyState description={t("salesReport.empty")} className="py-10" />
              ) : (
                <div className="flex flex-col divide-y divide-gray-50">
                  {vm.rows.map((row, idx) => (
                    <ProductBarRow key={row.product_id} rank={idx + 1} row={row} mode={vm.mode} maxVal={vm.maxVal} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardPageLayout>
  );
}
