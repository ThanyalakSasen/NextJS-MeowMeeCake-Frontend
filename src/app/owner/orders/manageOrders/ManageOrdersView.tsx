"use client";
// View ของ Manage Orders — JSX ล้วน รับ props จาก useManageOrdersViewModel
import { Tooltip } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { DataTable, FilterToolbar, SearchInput, TypeTabBar, type Column } from "@/components/shared/data";
import { DetailDrawer } from "@/components/shared/feedback";
import { StatusBadge } from "@/components/shared/stats";
import { formatCurrency, formatDate } from "@/i18n/format";
import { PAYMENT_STATUS_CONFIG } from "@/constants/enumConfig";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";
import type { Order } from "@/types/order";
import type { useManageOrdersViewModel } from "./useManageOrdersViewModel";
import { STATUS_SELECT_OPTIONS } from "./orderStatus";
import { OrderStatusFilter } from "./_components/OrderStatusFilter";
import { PaymentSlipPreview } from "./_components/PaymentSlipPreview";
import { OrderDetailContent } from "./_components/OrderDetailContent";

type VM = ReturnType<typeof useManageOrdersViewModel>;

export function ManageOrdersView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<Order>[] = [
    {
      key: "order_no",
      title: t("orders.colOrder"),
      render: (o) => (
        <div>
          <p className="font-medium text-brown-800">{o.order_no}</p>
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
      key: "items",
      title: t("orders.colItems"),
      render: (o) => (
        <span className="text-gray-700">{o.items.map((it) => `${it.product_name} ×${it.quantity}`).join(", ")}</span>
      ),
    },
    ...(vm.activeTab === "preorder"
      ? [{
          key: "leadTime",
          title: t("orders.leadTime"),
          render: (o: Order) => t("orders.leadTimeDays", { n: o.lead_time_days ?? 0 }),
        } as Column<Order>]
      : []),
    {
      key: "total_amount",
      title: t("orders.colTotal"),
      align: "right",
      render: (o) => formatCurrency(o.total_amount, locale),
    },
    {
      key: "order_status",
      title: t("orders.colStatus"),
      render: (o) => {
        if (vm.isFinalStatus(o.order_status)) return <StatusBadge group="orderStatus" value={o.order_status} />;

        const paymentVerified = o.payment_status === "paid";
        const select = (
          <Select
            size="small"
            value={o.order_status}
            disabled={!paymentVerified || !vm.perm.update}
            style={{ width: 140 }}
            options={STATUS_SELECT_OPTIONS.map((s) => ({ value: s, label: t(`enums.orderStatus.${s}`) }))}
            onChange={(next) => vm.onStatusChange(o, next as OrderStatus)}
          />
        );
        return paymentVerified ? select : <Tooltip title={t("orders.statusLockedHint")}>{select}</Tooltip>;
      },
    },
    {
      key: "payment_status",
      title: t("orders.colPayment"),
      render: (o) => (
        <Select
          size="small"
          value={o.payment_status}
          disabled={!vm.perm.update}
          style={{ width: 140 }}
          options={(Object.keys(PAYMENT_STATUS_CONFIG) as PaymentStatus[]).map((s) => ({
            value: s,
            label: t(`enums.paymentStatus.${s}`),
          }))}
          onChange={(next) => vm.onPaymentStatusChange(o, next as PaymentStatus)}
        />
      ),
    },
    {
      key: "slip",
      title: t("orders.colSlip"),
      align: "center",
      render: (o) => <PaymentSlipPreview order={o} />,
    },
  ];

  return (
    <ListPageLayout
      title={t("orders.title")}
      description={t("orders.description")}
      actions={
        <Button icon={<ArrowDownTrayIcon className="h-4 w-4" />} onClick={vm.onExport}>
          {t("orders.export")}
        </Button>
      }
      toolbar={
        <div className="flex flex-col gap-3">
          <FilterToolbar
            left={
              <>
                <TypeTabBar
                  value={vm.activeTab}
                  onChange={vm.setActiveTab}
                  options={[
                    { value: "ready", label: `${t("enums.orderType.ready")} (${vm.readyCount})` },
                    { value: "preorder", label: `${t("enums.orderType.preorder")} (${vm.preorderCount})` },
                  ]}
                />
                <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("orders.searchPlaceholder")} />
              </>
            }
            right={
              <>
                <OrderStatusFilter orders={vm.ordersForStats} value={vm.statusFilter} onChange={vm.setStatusFilter} />
                <div style={{ minWidth: 200 }}>
                  <Select
                    value={vm.paymentFilter}
                    onChange={(v) => vm.setPaymentFilter(v as PaymentStatus | "all")}
                    popupMatchSelectWidth={false}
                    options={[
                      { value: "all", label: `${t("common.all")} (${vm.ordersForStats.length})` },
                      ...(Object.keys(PAYMENT_STATUS_CONFIG) as PaymentStatus[]).map((s) => ({
                        value: s,
                        label: `${t(`enums.paymentStatus.${s}`)} (${vm.ordersForStats.filter((o) => o.payment_status === s).length})`,
                      })),
                    ]}
                  />
                </div>
              </>
            }
          />

          {vm.unreviewedCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-sm text-amber-800">{t("orders.unreviewedPaymentAlert", { n: vm.unreviewedCount })}</span>
              <Button size="small" onClick={() => vm.setPaymentFilter("pending")}>{t("orders.showList")}</Button>
            </div>
          )}
        </div>
      }
    >
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={vm.orders}
          loading={vm.isLoading}
          emptyText={t("orders.empty")}
          actions={(o) => (
            <div className="flex justify-end gap-2">
              <Button size="small" onClick={() => vm.onView(o)}>{t("common.view")}</Button>
              {vm.perm.update && !vm.isFinalStatus(o.order_status) && (
                <Button size="small" danger onClick={() => vm.onCancel(o)}>{t("orders.cancel")}</Button>
              )}
            </div>
          )}
          pagination={{ page: vm.page, pageSize: vm.pageSize, total: vm.total, onChange: vm.setPagination }}
        />
      )}

      <DetailDrawer
        open={vm.drawerOpen}
        title={vm.selectedOrder ? t("orders.drawerTitle", { no: vm.selectedOrder.order_no }) : ""}
        onClose={vm.closeDrawer}
      >
        {vm.selectedOrder && (
          <OrderDetailContent
            order={vm.selectedOrder}
            canApprovePayment={vm.canApprovePayment}
            onVerifyPayment={vm.onVerifyPayment}
          />
        )}
      </DetailDrawer>
    </ListPageLayout>
  );
}
