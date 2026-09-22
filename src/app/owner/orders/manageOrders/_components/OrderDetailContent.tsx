"use client";
// เนื้อหาข้างใน DetailDrawer ของ Manage Orders — presentational ล้วน
// order มาจาก ordersService.get(id) เสมอ (มี items จริง) · payment มาจาก paymentsService.listByOrder
// (คนละ resource กับ order — สลิป/verified_at อยู่ในนี้ ไม่ใช่ field บน order)
import { Divider, Tag, Image } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Avatar, Button } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { Order } from "@/types/order";
import type { Payment } from "@/types/payment";
import { OrderLifecycleSteps } from "./OrderLifecycleSteps";

export function OrderDetailContent({
  order,
  payment,
  canApprovePayment,
  onVerifyPayment,
}: {
  order: Order;
  payment: Payment | null;
  canApprovePayment: boolean;
  onVerifyPayment: (paymentId: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const isCancelled = order.order_status === "cancelled";

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
        <Tag color="error" className="w-fit">{t("orders.cancelledBanner")}</Tag>
      ) : (
        <OrderLifecycleSteps status={order.order_status} />
      )}

      <Divider className="!my-0" />

      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">{t("orders.colItems")}</p>
        <div className="flex flex-col gap-1.5">
          {(order.items ?? []).map((it) => (
            <div key={it._id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {it.product_name}
                {it.variant_name ? ` (${it.variant_name})` : ""}
              </span>
              <span className="text-gray-600">×{it.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider className="!my-0" />

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.orderType")}</span>
          <span className="font-medium text-gray-800">{t(`enums.orderType.${order.order_type}`)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.colPayment")}</span>
          <StatusBadge group="paymentStatus" value={order.payment_status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{t("orders.orderedAt")}</span>
          <span className="font-medium text-gray-800">{formatDate(order.created_at, locale, { withTime: true })}</span>
        </div>
      </div>

      <Divider className="!my-0" />

      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">{t("orders.paymentProof")}</p>
        {payment?.slip_image_url ? (
          <div className="flex items-center gap-3">
            <Image
              src={payment.slip_image_url}
              alt={t("orders.paymentProof")}
              width={56}
              height={56}
              className="rounded-lg border border-gray-200 !object-cover"
            />
            <div className="min-w-0 flex-1">
              {payment.verified_at ? (
                <StatusBadge group="paymentStatus" value={payment.status === "paid" ? "paid" : "failed"} />
              ) : (
                <>
                  <p className="mb-1.5 text-sm font-medium text-amber-700">{t("orders.slipAwaitingReview")}</p>
                  {canApprovePayment && (
                    <Button size="small" type="primary" onClick={() => onVerifyPayment(payment._id)}>
                      {t("orders.verifyPayment")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">{t("orders.noSlipYet")}</p>
        )}
      </div>

      <Divider className="!my-0" />

      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">{t("orders.totalLabel")}</span>
        <span className="text-lg font-bold text-brown-800">{formatCurrency(order.total_amount, locale)}</span>
      </div>
    </div>
  );
}
