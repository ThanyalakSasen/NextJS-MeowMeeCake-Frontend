"use client";
// View ของ Manage Orders — JSX ล้วน รับ props จาก useManageOrdersViewModel
// payment_status แสดงเป็น badge อ่านอย่างเดียว (แก้ตรง ๆ ไม่ได้ — backend จัดการผ่าน resource
// Payments/verify เท่านั้น) · คอลัมน์ items/สลิปเอาออกจากตาราง (ต้องเรียก getById ต่อแถว ไม่คุ้ม
// N+1 — ดูรายละเอียดเต็มได้ที่ drawer ผ่านปุ่ม "ดู")
import { useTranslations, useLocale } from "next-intl";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, LazySelect, Select, Tag } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { DataTable, FilterToolbar, SearchInput, TypeTabBar, type Column, FilterField } from "@/components/shared/data";
import { DetailModal, LazyTooltip, LoadFailed } from "@/components/shared/feedback";
import { StatusBadge } from "@/components/shared/stats";
import { formatCurrency, formatDate } from "@/i18n/format";
import { NOTICE_TAG, PAYMENT_STATUS_CONFIG } from "@/constants/enumConfig";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";
import { isAwaitingRefund, type Order } from "@/types/order";
import { ViewButton, actionIcon } from "@/components/shared/actions";
import { StockAlertSection } from "@/components/shared/stock";
import type { useManageOrdersViewModel } from "./useManageOrdersViewModel";
import { statusSelectOptions } from "./orderStatus";
import { OrderStatusFilter } from "./_components/OrderStatusFilter";
import { OrderDetailContent } from "./_components/OrderDetailContent";
import { CancelOrderModal } from "./_components/CancelOrderModal";

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
        <div className="flex items-center justify-center gap-2">
          <Avatar name={o.customer_name} size={28} />
          <div>
            <p className="font-medium text-brown-800">{o.customer_name}</p>
            <p className="text-sm text-gray-600">{o.customer_phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "total_amount",
      title: t("orders.colTotal"),
      render: (o) => formatCurrency(o.total_amount, locale),
    },
    {
      key: "order_status",
      title: t("orders.colStatus"),
      render: (o) => {
        if (vm.isFinalStatus(o.order_status)) return <StatusBadge group="orderStatus" value={o.order_status} />;

        // ช่องเปลี่ยนสถานะมีทุกแถว (ตารางแจ้งเตือน + ตารางหลัก) — LazySelect/LazyTooltip สร้าง antd ตอนกด/ชี้ (TBT มือถือ)
        const paymentVerified = o.payment_status === "paid";
        const select = (
          <LazySelect
            size="small"
            aria-label={t("filterLabel.changeOrderStatus", { orderNo: o.order_no })}
            value={o.order_status}
            disabled={!paymentVerified || !vm.perm.update}
            style={{ width: 140 }}
            options={statusSelectOptions(o.order_status, o.order_type).map((s) => ({ value: s, label: t(`enums.orderStatus.${s}`) }))}
            onChange={(next) => vm.onStatusChange(o, next as OrderStatus)}
          />
        );
        return paymentVerified ? (
          select
        ) : (
          <LazyTooltip title={t("orders.statusLockedHint")}>
            <span className="inline-block">{select}</span>
          </LazyTooltip>
        );
      },
    },
    {
      key: "payment_status",
      title: t("orders.colPayment"),
      // ยกเลิก + ชำระแล้ว = ร้านยังต้องโอนคืน (ป้าย "ชำระแล้ว" เฉย ๆ ทำให้ดูเหมือนเรียบร้อย)
      render: (o) =>
        isAwaitingRefund(o) ? (
          <Tag color={NOTICE_TAG.awaitingRefund}>{t("orders.awaitingRefund")}</Tag>
        ) : (
          <StatusBadge group="paymentStatus" value={o.payment_status} />
        ),
    },
  ];

  const rowActions = (o: Order) => (
    <div className="flex justify-end gap-2">
      <ViewButton size="small" onClick={() => vm.onView(o)} />
      {vm.canMarkReady(o) && (
        <LazyTooltip title={t("orders.markReadyHint")}>
          <Button size="small" type="primary" icon={actionIcon("next", "small")} disabled={vm.changingStatus} onClick={() => vm.onMarkReady(o)}>
            {t(o.order_type === "delivery" ? "orders.markReadyDelivery" : "orders.markReadyTakeaway")}
          </Button>
        </LazyTooltip>
      )}
      {vm.perm.update && !vm.isFinalStatus(o.order_status) && (
        <Button size="small" danger icon={actionIcon("cancelAction", "small")} onClick={() => vm.onCancel(o)}>{t("orders.cancel")}</Button>
      )}
    </div>
  );

  // ลำดับ: ยังไม่ได้จัดส่ง → ยังไม่ได้ยืนยันการชำระเงิน → ยังไม่ได้แนบสลิป → กำลังดำเนินการ
  // (กล่องกำลังดำเนินการมักมีออเดอร์มากที่สุดและไม่เร่ง — ไว้ล่างสุด ไม่ดันกล่องตรวจสลิปลงไปใต้จอ)
  const alertSections = (
    [
      { key: "notShipped", tone: "info", rows: vm.alerts.notShipped, title: "orders.alertNotShippedTitle", description: "orders.alertNotShippedDesc" },
      { key: "unverified", tone: "danger", rows: vm.alerts.unverified, title: "orders.alertUnverifiedTitle", description: "orders.alertUnverifiedDesc" },
      { key: "noSlip", tone: "warn", rows: vm.alerts.noSlip, title: "orders.alertNoSlipTitle", description: "orders.alertNoSlipDesc" },
      { key: "inProgress", tone: "info", rows: vm.alerts.inProgress, title: "orders.alertInProgressTitle", description: "orders.alertInProgressDesc" },
    ] as const
  )
    .filter((s) => s.rows.length > 0)
    .map((s) => ({ ...s, title: t(s.title, { n: s.rows.length }), description: t(s.description) }));

  return (
    <ListPageLayout
      title={t("orders.title")}
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
                    { value: "delivery", label: t("orders.tabDelivery", { n: vm.deliveryCount }) },
                    { value: "takeaway", label: t("orders.tabTakeaway", { n: vm.takeawayCount }) },
                  ]}
                />
                <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("orders.searchPlaceholder")} />
              </>
            }
            right={
              <>
                <OrderStatusFilter orders={vm.ordersForStats} value={vm.statusFilter} onChange={vm.setStatusFilter} />
                <FilterField label={t("filterLabel.paymentStatus")} minWidth={200}>
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
                </FilterField>
              </>
            }
          />

          {vm.awaitingRefundCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-sm text-amber-800">{t("orders.awaitingRefundAlert", { n: vm.awaitingRefundCount })}</span>
              <Button
                size="small"
                icon={actionIcon("filter", "small")}
                onClick={() => {
                  vm.setStatusFilter("cancelled");
                  vm.setPaymentFilter("paid");
                }}
              >
                {t("orders.showList")}
              </Button>
            </div>
          )}

        </div>
      }
    >
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : (
        <div className="flex flex-col gap-5">
          {/* แบบหน้าสต็อก: รายการที่ต้องจัดการแยกเป็นกล่องเหนือตารางหลัก (ไม่มีรายการ = ไม่แสดงกล่อง) */}
          {alertSections.map((s) => (
            <StockAlertSection key={s.key} tone={s.tone} title={s.title} description={s.description}>
              <DataTable columns={columns} rows={s.rows} inCard actions={rowActions} />
            </StockAlertSection>
          ))}

          {alertSections.length > 0 && <h2 className="m-0 -mb-2 text-base font-semibold text-brown-900">{t("orders.allOrdersTitle")}</h2>}
          {vm.olderHidden && <p className="m-0 -mb-2 text-sm text-gray-500">{t("orders.olderHiddenNotice")}</p>}
          <DataTable
            columns={columns}
            rows={vm.orders}
            loading={vm.isLoading}
            emptyText={t("orders.empty")}
            actions={rowActions}
            pagination={{ page: vm.page, pageSize: vm.pageSize, total: vm.total, onChange: vm.setPagination }}
          />
        </div>
      )}

      <DetailModal
        open={vm.drawerOpen}
        title={vm.selectedOrder ? t("orders.drawerTitle", { no: vm.selectedOrder.order_no }) : ""}
        onClose={vm.closeDrawer}
        // ป๊อปอัปกลางจอ (เดิมแผงเลื่อนข้าง) — กว้างพอให้ Steps 5 ขั้นไม่ตัดคำ
        size={640}
      >
        {vm.isDetailLoading && <p className="py-10 text-center text-gray-500">{t("common.loading")}</p>}
        {vm.isDetailError && !vm.isDetailLoading && <p className="py-10 text-center text-gray-500">{t("orders.orderNotFound")}</p>}
        {vm.selectedOrder && !vm.isDetailLoading && (
          <OrderDetailContent
            order={vm.selectedOrder}
            payment={vm.selectedPayment}
            canApprovePayment={vm.canApprovePayment}
            canRefundPayment={vm.canRefundPayment}
            onVerifyPayment={vm.onVerifyPayment}
            onRejectPayment={vm.onRejectPayment}
            verifyingPayment={vm.verifyingPayment}
            canUpdateDelivery={vm.perm.update}
            savingDelivery={vm.savingDelivery}
            onSaveDelivery={vm.onSaveDelivery}
            paidPaymentId={vm.paidPayment?._id ?? null}
            refunding={vm.refunding}
            onRefund={vm.onRefund}
            canMarkReady={vm.canMarkReady(vm.selectedOrder)}
            markingReady={vm.changingStatus}
            onMarkReady={() => vm.selectedOrder && vm.onMarkReady(vm.selectedOrder)}
            canMarkShipped={vm.canMarkShipped(vm.selectedOrder)}
            markingShipped={vm.markingShipped}
            onMarkShipped={vm.onMarkShipped}
          />
        )}
      </DetailModal>

      <CancelOrderModal
        key={vm.cancelTarget?._id ?? "none"}
        order={vm.cancelTarget}
        saving={vm.cancelling}
        onClose={vm.closeCancel}
        onConfirm={vm.onConfirmCancel}
      />
    </ListPageLayout>
  );
}
