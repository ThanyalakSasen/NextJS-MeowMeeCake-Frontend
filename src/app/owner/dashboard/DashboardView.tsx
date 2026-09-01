"use client";
// View ของ Dashboard — JSX ล้วน รับ props จาก useDashboardViewModel
// i18n: t ตัวเดียว key path เต็ม (t("dashboard.title"), t("common.retry"))
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/base";
import { DashboardPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { LoadingSpin } from "@/components/shared/feedback";
import { formatCurrency, formatDate, formatNumber } from "@/i18n/format";
import type { useDashboardViewModel } from "./useDashboardViewModel";
import { RecentOrdersWidget } from "./_components/RecentOrdersWidget";
import { LowStockWidget } from "./_components/LowStockWidget";
import { TopProductsWidget } from "./_components/TopProductsWidget";
import { ProductionStatusWidget } from "./_components/ProductionStatusWidget";

type VM = ReturnType<typeof useDashboardViewModel>;

export function DashboardView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const description = vm.generatedAt
    ? t("dashboard.asOf", { date: formatDate(vm.generatedAt, locale) })
    : t("dashboard.description");

  return (
    <DashboardPageLayout title={t("dashboard.title")} description={description}>
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
        </div>
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <>
          <StatCardsGrid>
            <StatCard
              label={t("dashboard.statRevenueToday")}
              value={formatCurrency(vm.stats?.revenue_today ?? 0, locale)}
              sub={t("dashboard.statRevenueTodaySub", { n: vm.stats?.order_count_today ?? 0 })}
              tone="up"
            />
            <StatCard
              label={t("dashboard.statOrdersToday")}
              value={formatNumber(vm.stats?.order_count_today ?? 0, locale)}
              sub={t("dashboard.statOrdersTodaySub")}
            />
            <StatCard
              label={t("dashboard.statPending")}
              value={formatNumber(vm.stats?.pending_order_count ?? 0, locale)}
              sub={t("dashboard.statPendingSub")}
              tone="warn"
            />
            <StatCard
              label={t("dashboard.statLowStock")}
              value={formatNumber(vm.stats?.low_stock_count ?? 0, locale)}
              sub={t("dashboard.statLowStockSub")}
              tone="down"
            />
          </StatCardsGrid>

          {/* 2 คอลัมน์ ซ้าย (กว้างกว่า) : ขวา = 2:1 บน lg — ต่ำกว่านั้นซ้อนเป็นแถวเดียว
              ซ้าย: ออเดอร์ล่าสุด + สินค้าขายดี · ขวา: วัตถุดิบใกล้หมด + สถานะการผลิต */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex flex-col gap-5 lg:col-span-2">
              <RecentOrdersWidget orders={vm.recentOrders} />
              <TopProductsWidget products={vm.topProducts} />
            </div>
            <div className="flex flex-col gap-5">
              <LowStockWidget items={vm.lowStock} />
              <ProductionStatusWidget items={vm.productionStatus} />
            </div>
          </div>
        </>
      )}
    </DashboardPageLayout>
  );
}
