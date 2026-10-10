"use client";
// เนื้อหาข้างใน DetailDrawer ของ Manage Orders — presentational ล้วน
// order มาจาก ordersService.get(id) เสมอ (มี items จริง) · payment มาจาก paymentsService.listByOrder
// (คนละ resource กับ order — สลิป/verified_at อยู่ในนี้ ไม่ใช่ field บน order)
import { useTranslations, useLocale } from "next-intl";
import { Avatar, Button, Divider, Tag } from "@/components/base";
import { StatusBadge } from "@/components/shared/stats";
import { formatCurrency, formatDate } from "@/i18n/format";
import { isAwaitingRefund, type DeliveryUpdateInput, type Order } from "@/types/order";
import type { Payment } from "@/types/payment";
import { actionIcon } from "@/components/shared/actions";
import { OrderLifecycleSteps } from "./OrderLifecycleSteps";
import { SlipImage } from "../../_components/SlipImage";
import { DeliverySection } from "../../_components/DeliverySection";
import { RefundSection } from "../../_components/RefundSection";

export function OrderDetailContent({
  order,
  payment,
  canApprovePayment,
  verifyingPayment,
  onVerifyPayment,
  onRejectPayment,
  canUpdateDelivery,
  savingDelivery,
  onSaveDelivery,
  paidPaymentId,
  refunding,
  onRefund,
}: {
  order: Order;
  payment: Payment | null;
  canApprovePayment: boolean;
  verifyingPayment: boolean;
  onVerifyPayment: (paymentId: string) => void;
  onRejectPayment: (paymentId: string) => void;
  canUpdateDelivery: boolean;
  savingDelivery: boolean;
  onSaveDelivery: (input: DeliveryUpdateInput) => void;
  /** รายการที่ชำระแล้ว — ใช้คืนเงินเมื่อ "ยกเลิก + ชำระแล้ว" */
  paidPaymentId: string | null;
  refunding: boolean;
  onRefund: (paymentId: string) => void;
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
        <div>
          <Tag color="error" className="w-fit">{t("orders.cancelledBanner")}</Tag>
          {/* เหตุผลแสดงใน RefundSection แทนเมื่อรอโอนคืน (ไม่ซ้ำสองที่) */}
          {order.cancelled_reason && !isAwaitingRefund(order) && (
            <p className="mt-1.5 text-sm text-gray-600">{order.cancelled_reason}</p>
          )}
        </div>
      ) : (
        <OrderLifecycleSteps status={order.order_status} />
      )}

      {isAwaitingRefund(order) && (
        <RefundSection
          amount={order.total_amount}
          reason={order.cancelled_reason}
          account={order.refund_account}
          paidPaymentId={paidPaymentId}
          canRefund={canApprovePayment}
          refunding={refunding}
          onRefund={onRefund}
        />
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
                {(it.selected_options ?? []).map((o) => (
                  <span key={o.option_name} className="block text-xs text-gray-500">
                    + {o.option_name}
                    {o.text_value ? `: "${o.text_value}"` : ""}
                  </span>
                ))}
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
        {/* ออเดอร์เว็บ: ต้องจ่ายภายใน 30 นาที — เลยแล้วยังไม่ส่งสลิป backend ยกเลิกให้ (customer-backend-merge.md §8.8) */}
        {order.payment_due_at && order.payment_status !== "paid" && order.payment_status !== "refunded" && !isCancelled && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t("orders.paymentDueAt")}</span>
            <span className="font-medium text-gray-800">{formatDate(order.payment_due_at, locale, { withTime: true })}</span>
          </div>
        )}
        {order.order_type === "takeaway" && order.pickup_point && (
          <div className="flex items-start justify-between gap-3">
            <span className="shrink-0 text-gray-600">{t("orders.pickupPoint")}</span>
            <span className="text-right font-medium text-gray-800">
              {order.pickup_point.point_name}
              {order.pickup_point.address && <span className="block text-xs font-normal text-gray-500">{order.pickup_point.address}</span>}
            </span>
          </div>
        )}
        {order.order_type === "takeaway" && order.pickup_date && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t("orders.pickupOn")}</span>
            <span className="font-medium text-gray-800">{formatDate(order.pickup_date, locale)}</span>
          </div>
        )}
      </div>

      {order.order_type === "delivery" && (
        <>
          <Divider className="!my-0" />
          <DeliverySection
            key={order.updated_at}
            info={order}
            canUpdate={canUpdateDelivery && !isCancelled}
            saving={savingDelivery}
            onSave={onSaveDelivery}
          />
        </>
      )}

      <Divider className="!my-0" />

      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">{t("orders.paymentProof")}</p>
        {payment?.slip_image_url ? (
          <div className="flex items-center gap-3">
            <SlipImage url={payment.slip_image_url} size={56} />
            <div className="min-w-0 flex-1">
              {/* ตัดสินจาก status ไม่ใช่ verified_at — สลิปที่ถูกปฏิเสธแล้วลูกค้าแนบใหม่ backend เปลี่ยนกลับเป็น
                  pending แต่ verified_at ยังค้างค่าตอนปฏิเสธ (เดิมเลยไม่มีปุ่มให้ตรวจสลิปใหม่) */}
              {payment.status === "pending" ? (
                <>
                  <p className="mb-1.5 text-sm font-medium text-amber-700">{t("orders.slipAwaitingReview")}</p>
                  {canApprovePayment && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="small"
                        type="primary"
                        icon={actionIcon("verify", "small")}
                        loading={verifyingPayment}
                        onClick={() => onVerifyPayment(payment._id)}
                      >
                        {t("orders.verifyPayment")}
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={actionIcon("cancelAction", "small")}
                        disabled={verifyingPayment}
                        onClick={() => onRejectPayment(payment._id)}
                      >
                        {t("orders.rejectPayment")}
                      </Button>
                    </div>
                  )}
                </>
              ) : payment.status === "failed" ? (
                <p className="text-sm font-medium text-danger">{t("orders.slipRejected")}</p>
              ) : (
                <StatusBadge group="paymentStatus" value={payment.status} />
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">{t("orders.noSlipYet")}</p>
        )}
      </div>

      <Divider className="!my-0" />

      <div className="flex flex-col gap-1.5 text-sm">
        <AmountRow label={t("orders.subtotal")} value={order.subtotal} locale={locale} />
        {order.delivery_fee > 0 && <AmountRow label={t("orders.deliveryFee")} value={order.delivery_fee} locale={locale} />}
        {/* discount_amount = ส่วนลดรวม (โค้ด/คูปอง/แต้ม) — แตกที่มาเมื่อเป็นออเดอร์เว็บที่ใช้แต้มหรือคูปอง */}
        {order.discount_amount > 0 && <AmountRow label={t("orders.discount")} value={-order.discount_amount} locale={locale} />}
        {order.points_redeemed > 0 && (
          <p className="m-0 text-right text-xs text-gray-500">
            {t("orders.pointsUsed", { n: order.points_redeemed, amount: formatCurrency(order.points_discount, locale) })}
          </p>
        )}
        {order.coupon_discount > 0 && (
          <p className="m-0 text-right text-xs text-gray-500">
            {t("orders.couponUsed", { amount: formatCurrency(order.coupon_discount, locale) })}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">{t("orders.totalLabel")}</span>
        <span className="text-lg font-bold text-brown-800">{formatCurrency(order.total_amount, locale)}</span>
      </div>
    </div>
  );
}

function AmountRow({ label, value, locale }: { label: string; value: number; locale: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-800">{formatCurrency(value, locale)}</span>
    </div>
  );
}
