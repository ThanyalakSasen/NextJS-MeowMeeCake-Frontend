"use client";
// แท็บ "สรุปรอบ" (BACKLOG4 F4) — การ์ดสรุป · ตัวกรอง · ตารางต่อรอบ (จอง/โควตา · ออเดอร์แยกสถานะชำระเงิน · ยอดขาย)
// กดแถว/ปุ่มลูกค้า → RoundDashboardDrawer · presentational ล้วน รับ props จาก useRoundDashboardViewModel
import { useLocale, useTranslations } from "next-intl";
import { ProgressBar, Select } from "@/components/base";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { RetryButton, ViewButton } from "@/components/shared/actions";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { RoundStatus } from "@/constants/enumConfig";
import type { RoundDashboardRow } from "@/types/preorderRoundDashboard";
import type { useRoundDashboardViewModel } from "../useRoundDashboardViewModel";

type DVM = ReturnType<typeof useRoundDashboardViewModel>;

export function DashboardTab(vm: DVM) {
  const t = useTranslations();
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);

  const columns: Column<RoundDashboardRow>[] = [
    {
      key: "round",
      title: t("preorderRound.colRoundName"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.round_name}</p>
          <p className="text-sm text-gray-600">
            {formatDate(r.open_date, locale)} - {formatDate(r.close_date, locale)} · {t("preorderRound.colPickupDate")} {formatDate(r.pickup_date, locale)}
          </p>
        </div>
      ),
    },
    { key: "status", title: t("common.status"), width: 120, render: (r) => <StatusBadge group="roundStatus" value={r.round_status} /> },
    {
      key: "quota",
      title: t("preorderRound.dashboard.colQuota"),
      width: 170,
      render: (r) => (
        <div>
          <ProgressBar percent={r.fill_rate} />
          <p className="m-0 text-xs text-gray-600">
            {t("preorderRound.dashboard.quotaText", { ordered: r.total_ordered_qty, quota: r.total_quota, products: r.product_count, pct: r.fill_rate })}
          </p>
        </div>
      ),
    },
    {
      key: "orders",
      title: t("preorderRound.dashboard.colOrders"),
      width: 190,
      render: (r) => (
        <div className="text-sm text-gray-700">
          <p className="m-0">{t("preorderRound.dashboard.ordersText", { n: r.total_orders, customers: r.customer_count })}</p>
          <p className="m-0 text-xs text-gray-500">
            {t("preorderRound.dashboard.ordersBreakdown", { paid: r.payment.paid.count, pending: r.payment.pending.count, cancelled: r.payment.cancelled.count })}
          </p>
        </div>
      ),
    },
    {
      key: "revenue",
      title: t("preorderRound.dashboard.colRevenue"),
      width: 150,
      align: "right",
      render: (r) => (
        <div>
          <p className="m-0 font-semibold text-brown-800">{money(r.total_revenue)}</p>
          <p className="m-0 text-xs text-gray-500">{t("preorderRound.dashboard.paidAmount", { amount: money(r.payment.paid.amount) })}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <StatCardsGrid>
        <StatCard label={t("preorderRound.dashboard.statRounds")} value={vm.stats.rounds} sub={t("preorderRound.dashboard.statOpen", { n: vm.stats.open })} />
        <StatCard label={t("preorderRound.dashboard.statRevenue")} value={money(vm.stats.revenue)} sub={t("preorderRound.dashboard.statRevenueSub")} tone="up" />
        <StatCard label={t("preorderRound.dashboard.statPaid")} value={money(vm.stats.paid)} />
        <StatCard label={t("preorderRound.dashboard.statFill")} value={`${vm.stats.avgFill}%`} tone="muted" />
      </StatCardsGrid>

      <FilterToolbar
        left={
          <>
            <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("preorderRound.searchRoundPlaceholder")} />
            <div style={{ minWidth: 160 }}>
              <Select
                value={vm.statusFilter}
                onChange={(v) => vm.setStatusFilter(v as RoundStatus | "all")}
                options={[
                  { value: "all", label: t("common.all") },
                  ...(["scheduled", "open", "closed", "cancelled"] as RoundStatus[]).map((s) => ({ value: s, label: t(`enums.roundStatus.${s}`) })),
                ]}
              />
            </div>
          </>
        }
      />

      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <RetryButton onClick={vm.refetch} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={vm.rows}
          rowKey={(r) => r._id}
          loading={vm.isLoading}
          emptyText={t("preorderRound.roundsEmpty")}
          onRowClick={vm.openRound}
          actions={(r) => <ViewButton size="small" onClick={() => vm.openRound(r)} />}
          pagination={{ page: vm.page, pageSize: vm.pageSize, total: vm.total, onChange: (p) => vm.setPage(p) }}
        />
      )}
    </div>
  );
}
