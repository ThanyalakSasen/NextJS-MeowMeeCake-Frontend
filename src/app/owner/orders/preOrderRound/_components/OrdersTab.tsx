"use client";
// แท็บ 2: คำสั่งซื้อพรีออเดอร์ (Preorders) — presentational ล้วน รับ props จาก usePreOrderRoundViewModel
import { useTranslations, useLocale } from "next-intl";
import { Avatar, Select, Tag } from "@/components/base";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { isAwaitingRefund, type OrderType } from "@/types/order";
import { DataTable, FilterToolbar, SearchInput, type Column, FilterField } from "@/components/shared/data";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { OrderStatus } from "@/constants/enumConfig";
import type { Preorder } from "@/types/preorder";
import { ViewButton } from "@/components/shared/actions";
import type { usePreOrderRoundViewModel } from "../usePreOrderRoundViewModel";
import { NOTICE_TAG } from "@/constants/enumConfig";
import { LoadFailed } from "@/components/shared/feedback";

type VM = ReturnType<typeof usePreOrderRoundViewModel>;

// โชว์สินค้าในตารางกี่บรรทัด ที่เหลือย่อเป็น "+ อีก n รายการ" (ดูครบในลิ้นชัก)
const ITEMS_PREVIEW = 2;

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
      // พรีออเดอร์แบบจัดส่ง: สถานะจัดส่ง + เลขพัสดุ (แก้ได้ในป๊อปอัปรายละเอียด) · รับเองแสดงแค่วิธีรับ
      key: "delivery",
      title: t("preorderRound.colDelivery"),
      render: (o) => (
        <div className="text-sm">
          <p className="text-gray-800">{t(`enums.orderType.${o.order_type}`)}</p>
          {o.order_type === "delivery" && (
            <>
              <StatusBadge group="deliveryStatus" value={o.delivery_status} />
              {o.tracking_no && <p className="mt-0.5 text-gray-600">{t("orders.trackingNo")}: {o.tracking_no}</p>}
            </>
          )}
        </div>
      ),
    },
    {
      key: "items",
      title: t("orders.colItems"),
      render: (o) => {
        const items = o.items ?? [];
        return (
          <div className="text-sm">
            {items.slice(0, ITEMS_PREVIEW).map((it) => (
              <p key={it._id} className="text-gray-800">
                {it.product_name} <span className="text-gray-600">×{it.quantity}</span>
              </p>
            ))}
            {items.length > ITEMS_PREVIEW && (
              <p className="text-gray-600">{t("preorderRound.moreItems", { n: items.length - ITEMS_PREVIEW })}</p>
            )}
          </div>
        );
      },
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
      render: (o) => {
        // ยังไม่จ่าย → โชว์กำหนดชำระใต้ badge (เลยกำหนด = ระบบจะยกเลิกอัตโนมัติ — backend #55)
        const due = vm.paymentDueState(o);
        return (
          <div>
            {isAwaitingRefund(o) ? (
              <Tag color={NOTICE_TAG.awaitingRefund}>{t("orders.awaitingRefund")}</Tag>
            ) : (
              <StatusBadge group="paymentStatus" value={o.payment_status} />
            )}
            {due && o.payment_due_at && (
              <p className={`mt-0.5 text-sm ${due === "overdue" ? "text-danger" : "text-gray-600"}`}>
                {due === "overdue"
                  ? t("preorderRound.paymentOverdue")
                  : `${t("preorderRound.paymentDue")}: ${formatDate(o.payment_due_at, locale, { withTime: true })}`}
              </p>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base text-gray-600">{t("preorderRound.ordersDescription", { n: vm.orderTotal })}</p>
      {vm.olderPreordersHidden && <p className="m-0 -mt-3 text-sm text-gray-500">{t("preorderRound.olderHiddenNotice")}</p>}

      <StatCardsGrid>
        <StatCard label={t("common.all")} value={vm.orderStats.total} />
        <StatCard label={t("enums.orderStatus.pending")} value={vm.orderStats.pending} tone="warn" />
        <StatCard label={t("preorderRound.statInProgress")} value={vm.orderStats.inProgress} />
        <StatCard label={t("enums.orderStatus.completed")} value={vm.orderStats.completed} tone="up" />
      </StatCardsGrid>

      <FilterToolbar
        left={<SearchInput value={vm.orderSearch} onChange={vm.setOrderSearch} placeholder={t("preorderRound.searchOrderPlaceholder")} />}
        // ตัวกรองชิดขวา (ช่องค้นหา/แท็บอยู่ซ้าย) — แบบเดียวกับหน้าพนักงาน
        right={
          <>
            <FilterField label={t("filterLabel.round")} minWidth={180}>
              <Select
                value={vm.orderRoundFilter}
                onChange={(v) => vm.setOrderRoundFilter(v as string)}
                options={[{ value: "all", label: t("preorderRound.allRounds") }, ...vm.roundOptions]}
              />
            </FilterField>
            <FilterField label={t("filterLabel.orderType")} minWidth={150}>
              <Select
                value={vm.orderTypeFilter}
                onChange={(v) => vm.setOrderTypeFilter(v as OrderType | "all")}
                options={[
                  { value: "all", label: t("preorderRound.dashboard.allTypes") },
                  ...(["takeaway", "delivery"] as OrderType[]).map((o) => ({ value: o, label: t(`enums.orderType.${o}`) })),
                ]}
              />
            </FilterField>
            <FilterField label={t("filterLabel.orderStatus")} minWidth={160}>
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
            </FilterField>
          </>
        }
      />

      {vm.isOrdersError ? (
        <LoadFailed onRetry={vm.refetchOrders} />
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
