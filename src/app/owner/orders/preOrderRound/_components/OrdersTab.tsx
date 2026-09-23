"use client";
// แท็บ 2: คำสั่งซื้อเค้กวันเกิด (Preorders) — presentational ล้วน รับ props จาก usePreOrderRoundViewModel
import { useTranslations, useLocale } from "next-intl";
import { Avatar, Select } from "@/components/base";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { OrderStatus } from "@/constants/enumConfig";
import type { Preorder } from "@/types/preorder";
import { RetryButton, ViewButton } from "@/components/shared/actions";
import type { usePreOrderRoundViewModel } from "../usePreOrderRoundViewModel";

type VM = ReturnType<typeof usePreOrderRoundViewModel>;

export function OrdersTab(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<Preorder>[] = [
    {
      key: "preorder_no",
      title: t("preorderRound.colOrderNo"),
      render: (o) => (
        <div>
          <p className="font-medium text-brown-800">{o.preorder_no}</p>
          <p className="text-sm text-gray-600">{formatDate(o.created_at, locale, { withTime: true })}</p>
        </div>
      ),
    },
    {
      key: "customer",
      title: t("orders.colCustomer"),
      render: (o) => (
        <div className="flex items-center gap-2">
          <Avatar name={o.customer_name} size={28} />
          <div>
            <p className="font-medium text-brown-800">{o.customer_name}</p>
            <p className="text-sm text-gray-600">{o.customer_phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "round",
      title: t("preorderRound.colRound"),
      render: (o) => (
        <div>
          <p className="text-brown-800">{o.round_name}</p>
          {o.round_pickup_date && <p className="text-sm text-gray-600">{t("orders.pickupDate")}: {formatDate(o.round_pickup_date, locale)}</p>}
        </div>
      ),
    },
    {
      key: "total_amount",
      title: t("orders.colTotal"),
      align: "right",
      render: (o) => formatCurrency(o.total_amount, locale),
    },
    {
      key: "order_status",
      title: t("orders.colStatus"),
      render: (o) => <StatusBadge group="orderStatus" value={o.order_status} />,
    },
    {
      key: "payment_status",
      title: t("orders.colPayment"),
      render: (o) => <StatusBadge group="paymentStatus" value={o.payment_status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base text-gray-600">{t("preorderRound.ordersDescription", { n: vm.orderTotal })}</p>

      <StatCardsGrid>
        <StatCard label={t("common.all")} value={vm.orderStats.total} />
        <StatCard label={t("enums.orderStatus.pending")} value={vm.orderStats.pending} tone="warn" />
        <StatCard label={t("preorderRound.statInProgress")} value={vm.orderStats.inProgress} />
        <StatCard label={t("enums.orderStatus.completed")} value={vm.orderStats.completed} tone="up" />
      </StatCardsGrid>

      <FilterToolbar
        left={
          <>
            <SearchInput value={vm.orderSearch} onChange={vm.setOrderSearch} placeholder={t("preorderRound.searchOrderPlaceholder")} />
            <div style={{ minWidth: 180 }}>
              <Select
                value={vm.orderRoundFilter}
                onChange={(v) => vm.setOrderRoundFilter(v as string)}
                options={[{ value: "all", label: t("preorderRound.allRounds") }, ...vm.roundOptions]}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <Select
                value={vm.orderStatusFilter}
                onChange={(v) => vm.setOrderStatusFilter(v as OrderStatus | "all")}
                options={[
                  { value: "all", label: t("common.all") },
                  ...(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"] as OrderStatus[]).map((s) => ({
                    value: s,
                    label: t(`enums.orderStatus.${s}`),
                  })),
                ]}
              />
            </div>
          </>
        }
      />

      {vm.isOrdersError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <RetryButton onClick={vm.refetchOrders} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={vm.orderRows}
          loading={vm.isOrdersLoading}
          emptyText={t("preorderRound.ordersEmpty")}
          onRowClick={vm.onViewOrder}
          actions={(o) => (
            <ViewButton size="small" onClick={() => vm.onViewOrder(o)} />
          )}
          pagination={{ page: vm.orderPage, pageSize: vm.orderPageSize, total: vm.orderTotal, onChange: vm.setOrderPagination }}
        />
      )}
    </div>
  );
}
