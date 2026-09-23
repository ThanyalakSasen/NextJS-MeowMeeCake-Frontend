"use client";
// เนื้อหาใน DetailDrawer ของคำสั่งซื้อเค้กวันเกิด (Preorder) — presentational ล้วน
import { Divider, Tag } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Avatar, Button } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { Preorder } from "@/types/preorder";
import { actionIcon } from "@/components/shared/actions";
import type { usePreOrderRoundViewModel } from "../usePreOrderRoundViewModel";

type VM = ReturnType<typeof usePreOrderRoundViewModel>;

export function PreorderDetailContent(vm: VM & { order: Preorder }) {
  const t = useTranslations();
  const locale = useLocale();
  const { order } = vm;
  const isCancelled = order.order_status === "cancelled";
  const final = vm.isFinalOrderStatus(order.order_status);
  const next = vm.getNextOrderStatus(order.order_status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar name={order.customer_name} size={44} />
        <div>
          <p className="font-semibold text-brown-800">{order.customer_name}</p>
          <p className="text-sm text-gray-600">{order.customer_phone}</p>
        </div>
      </div>

      <Divider className="!my-0" />

      {isCancelled ? (
        <div>
          <Tag color="error" className="w-fit">{t("orders.cancelledBanner")}</Tag>
          {order.cancelled_reason && <p className="mt-1.5 text-sm text-gray-600">{order.cancelled_reason}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <StatusBadge group="orderStatus" value={order.order_status} />
          <StatusBadge group="paymentStatus" value={order.payment_status} />
        </div>
      )}

      <Divider className="!my-0" />

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("preorderRound.colRound")}</span>
          <span className="font-medium text-gray-800">{order.round_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.orderType")}</span>
          <span className="font-medium text-gray-800">{t(`enums.orderType.${order.order_type}`)}</span>
        </div>
        {order.round_pickup_date && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t("orders.pickupDate")}</span>
            <span className="font-medium text-gray-800">{formatDate(order.round_pickup_date, locale)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.orderedAt")}</span>
          <span className="font-medium text-gray-800">{formatDate(order.created_at, locale, { withTime: true })}</span>
        </div>
      </div>

      {order.order_type === "delivery" && order.delivery_address && (
        <>
          <Divider className="!my-0" />
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">{t("preorderRound.deliveryAddress")}</p>
            <p className="text-sm text-gray-800">
              {order.delivery_address.recipient_name} · {order.delivery_address.recipient_phone}
            </p>
            <p className="text-sm text-gray-600">
              {order.delivery_address.house_no} {order.delivery_address.sub_district} {order.delivery_address.district}{" "}
              {order.delivery_address.province} {order.delivery_address.zip_code}
            </p>
          </div>
        </>
      )}

      <Divider className="!my-0" />

      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">{t("orders.colItems")}</p>
        <div className="flex flex-col gap-1.5">
          {(order.items ?? []).map((it) => (
            <div key={it._id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{it.product_name}</span>
              <span className="text-gray-600">×{it.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider className="!my-0" />

      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">{t("orders.totalLabel")}</span>
        <span className="text-lg font-bold text-brown-800">{formatCurrency(order.total_amount, locale)}</span>
      </div>

      {vm.perm.update && !final && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          <Button danger size="small" icon={actionIcon("cancelAction", "small")} onClick={() => vm.onCancelOrder(order)}>{t("orders.cancel")}</Button>
          {next && (
            <Button type="primary" size="small" icon={actionIcon("next", "small")} onClick={() => vm.onAdvanceOrderStatus(order)}>
              {t("preorderRound.advanceTo", { status: t(`enums.orderStatus.${next}`) })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
