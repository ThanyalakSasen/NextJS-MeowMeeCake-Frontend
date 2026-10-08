"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/purchases/[id] — รายละเอียดออเดอร์ + ชำระเงิน (BACKLOG3-merge D1 · ย้ายมาจาก /customer/order/[id])
// path ตาม FrontOffice (ลิงก์ในกระดิ่ง/LINE ของ backend ชี้มาที่นี่ — G1) · รวม customer/payment + order/success + purchases/[id]
// ยกเลิกออเดอร์ (C4): POST /shop/orders/{id}/cancel — pending/confirmed เท่านั้น · ชำระแล้ว = รอร้านโอนคืน
// ?new=1 = เพิ่งสั่งจากหน้า checkout → แสดงแถบ "สั่งซื้อสำเร็จ"
// ชำระเงิน: ../../_components/SlipPaymentPanel (ใช้ร่วมกับพรีออเดอร์ D3) — QR พร้อมเพย์จาก backend + กำหนดชำระ 30 นาที + แนบสลิป
//   มีรายการชำระเงินที่ pending/failed อยู่แล้ว = แนบกับใบเดิม · ยังไม่มี = POST /shop/payments ก่อน
//   แล้ว POST /shop/payments/{id}/slip (multipart — backend PR #54)
// หมดเวลาแล้ว (late_upload) = แนบสลิปกับใบเดิมเพื่อเปิดออเดอร์กลับ (backend docs/customer-backend-merge.md §8.8)
// U7: ไทม์ไลน์สถานะ · รูปสินค้า (จาก catalog) · ซื้ออีกครั้ง (ออเดอร์ที่จบแล้ว — สำเร็จ/ยกเลิก)
// ─────────────────────────────────────────────────────────────
import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCheckCircle } from "react-icons/fa";
import { canCustomerCancel, shopOrdersService } from "@/services/shopOrders";
import { shopPaymentsService } from "@/services/shopPayments";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { formatDate } from "@/i18n/format";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { baht, shopButton, shopButtonPrimary, shopCard, shopPage } from "@/components/customer/shopStyles";
import SlipPaymentPanel from "../../_components/SlipPaymentPanel";
import FlowSteps from "@/components/customer/FlowSteps";
import ReviewLink from "../../_components/ReviewLink";
import OrderTimeline from "../../_components/OrderTimeline";
import OrderItemThumb from "../../_components/OrderItemThumb";
import BuyAgainButton from "../../_components/BuyAgainButton";
import { shopOrderKey, shopOrderPaymentPageKey, shopOrdersKey } from "../../../lib/shopQueries";
import { useOrderLabels } from "../orderLabels";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

export default function OrderPage() {
  const t = useTranslations("shop.orders");
  return (
    <CustomerAuthGate message={t("loginToViewOne")}>
      {/* useSearchParams ต้องอยู่ใต้ Suspense (ไม่งั้น next build error) */}
      <Suspense fallback={null}>
        <OrderContent />
      </Suspense>
    </CustomerAuthGate>
  );
}

function OrderContent() {
  const t = useTranslations("shop.orders");
  const { name: localName } = useLocalName();
  const tc = useTranslations("shop.common");
  const labels = useOrderLabels();
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get("new") === "1";
  const router = useRouter();
  const tf = useTranslations("shop.flow");
  const validId = isObjectId(id ?? "");

  const orderQ = useQuery({
    queryKey: shopOrderKey(id),
    queryFn: () => shopOrdersService.get(id),
    enabled: validId,
    retry: (count, e) => !(isApiError(e) && [403, 404].includes(e.status)) && count < 2,
  });
  const paymentQ = useQuery({
    queryKey: shopOrderPaymentPageKey(id),
    queryFn: () => shopPaymentsService.orderPaymentPage(id),
    enabled: validId && orderQ.isSuccess,
  });
  const qc = useQueryClient();
  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: shopOrderPaymentPageKey(id) });
    void qc.invalidateQueries({ queryKey: shopOrderKey(id) });
  }, [qc, id]);

  if (validId && (orderQ.isLoading || paymentQ.isLoading)) {
    return (
      <div className={`${shopPage} flex items-center justify-center`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label={tc("loading")} />
      </div>
    );
  }

  const order = orderQ.data;
  if (!validId || !order) {
    return (
      <div className={`${shopPage} flex items-center justify-center px-4`}>
        <div className={`${shopCard} w-full max-w-md space-y-4 text-center`}>
          <h2 className="text-lg font-bold">{t("notFound")}</h2>
          <Link href="/customer" className={`${shopButtonPrimary} w-full`}>
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb
          items={[
            { label: t("myAccount"), href: "/customer/account" },
            { label: t("history"), href: "/customer/account/purchases" },
            { label: order.order_no },
          ]}
          className="!mb-0"
        />

        {isNew && <FlowSteps kind="order" current={order.payment_status === "paid" || order.has_payment ? 4 : 3} />}
        {isNew && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            <FaCheckCircle className="shrink-0 text-2xl" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{t("placed")}</p>
              <p className="text-sm">{t("placedHint")}</p>
            </div>
            <Link href={`/customer/account/purchases/${order._id}/success`} className="shrink-0 text-sm font-semibold text-green-800 underline">
              {tf("payLater")}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
          <section className={`${shopCard} space-y-4 lg:col-span-3`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-gray-500">{t("orderNoLabel")}</p>
                <h1 className="text-xl font-extrabold">{order.order_no}</h1>
                <p className="text-xs text-gray-500">{formatDate(order.created_at, locale, { withTime: true })}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs font-semibold">
                <span className="rounded-full bg-[#8C5A3C]/10 px-2.5 py-1 text-[#8C5A3C]">{labels.orderStatus(order.order_status)}</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{labels.paymentStatus(order.payment_status)}</span>
              </div>
            </div>

            <div className="border-t border-[#8C5A3C]/10 pt-4">
              <OrderTimeline order={order} />
            </div>

            {order.order_status === "cancelled" && order.cancelled_reason && (
              <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-600">{t("cancelReason", { reason: order.cancelled_reason })}</p>
            )}
            {order.order_status === "cancelled" && order.payment_status === "paid" && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t("refundInProgress")}</p>
            )}

            <div className="space-y-2 border-t border-[#8C5A3C]/10 pt-4">
              {order.items.map((it) => (
                <div key={it._id} className="flex items-center gap-3 text-sm">
                  <OrderItemThumb productId={it.product_id} alt={it.product_name} className="h-12 w-12" />
                  <span className="min-w-0 flex-1">
                    {localName(it.product_name, it.product_name_eng)}
                    {it.variant_name ? ` (${it.variant_name})` : ""} <span className="text-gray-500">×{it.quantity}</span>
                    {it.selected_options.map((o) => (
                      <span key={o.option_name} className="block text-xs text-gray-500">
                        + {o.option_name}
                        {o.text_value ? `: "${o.text_value}"` : ""}
                      </span>
                    ))}
                  </span>
                  <span className="font-semibold">{baht(it.total_price)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 border-t border-[#8C5A3C]/10 pt-4 text-sm">
              <Row label={t("subtotal")} value={baht(order.subtotal)} />
              <Row label={t("deliveryFee")} value={order.order_type === "takeaway" ? t("pickupAtStore") : baht(order.delivery_fee)} />
              {order.discount_amount > 0 && <Row label={t("discount")} value={`-${baht(order.discount_amount)}`} />}
              <div className="flex items-baseline justify-between pt-2">
                <span className="font-bold">{t("amountDue")}</span>
                <span className="text-2xl font-extrabold text-[#8C5A3C]">{baht(order.total_amount)}</span>
              </div>
            </div>

            {order.order_type === "takeaway" && (order.pickup_point_name || order.pickup_date) && (
              <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
                <p className="mb-1 font-semibold">{t("pickupAppointment")}</p>
                <p className="text-gray-600">
                  {order.pickup_date ? labels.pickupDate(order.pickup_date) : ""}
                  {order.pickup_point_name ? ` · ${order.pickup_point_name}` : ""}
                </p>
              </div>
            )}

            {order.order_type === "delivery" && order.delivery_status && order.order_status !== "cancelled" && (
              <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
                <p className="mb-1 font-semibold">{t("deliveryStatus")}</p>
                <p className="text-gray-600">
                  {labels.deliveryStatus(order.delivery_status)}
                  {order.tracking_no ? t("tracking", { no: order.tracking_no }) : ""}
                </p>
              </div>
            )}

            {order.order_type === "delivery" && order.delivery_address && (
              <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
                <p className="mb-1 font-semibold">{t("deliveryAddress")}</p>
                <p>
                  {order.delivery_address.recipient_name} · {order.delivery_address.recipient_phone}
                </p>
                <p className="text-gray-600">
                  {order.delivery_address.house_no} {order.delivery_address.sub_district} {order.delivery_address.district}{" "}
                  {order.delivery_address.province} {order.delivery_address.zip_code}
                </p>
              </div>
            )}
          </section>

          <section className={`${shopCard} space-y-4 lg:col-span-2`}>
            <h2 className="text-lg font-bold">{t("payment")}</h2>
            {paymentQ.data ? (
              <SlipPaymentPanel kind="order" docId={order._id} page={paymentQ.data} fetchedAt={paymentQ.dataUpdatedAt} onChanged={refresh}
                onUploaded={isNew ? () => router.push(`/customer/account/purchases/${order._id}/success`) : undefined} />
            ) : (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{t("paymentLoadFailed")}</p>
            )}
          </section>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/customer/account/purchases" className={shopButton}>
            {t("viewAll")}
          </Link>
          <Link href="/customer/product" className={shopButton}>
            {t("continueShopping")}
          </Link>
          <ReviewLink kind="order" doc={order} itemIds={order.items.map((it) => it._id)} href={`/customer/account/purchases/${order._id}/review`} className={shopButtonPrimary} />
          {(order.order_status === "completed" || order.order_status === "cancelled") && <BuyAgainButton items={order.items} className={shopButton} />}
          {canCustomerCancel(order) && <CancelOrderButton orderId={order._id} orderNo={order.order_no} paid={order.payment_status === "paid"} />}
        </div>
      </div>
    </div>
  );
}

/** ยกเลิกออเดอร์ (C4) — ชำระแล้วยกเลิกได้ แต่ต้องรอร้านโอนคืน (แจ้งในหน้าต่างยืนยัน) */
function CancelOrderButton({ orderId, orderNo, paid }: { orderId: string; orderNo: string; paid: boolean }) {
  const t = useTranslations("shop.orders");
  const qc = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => shopOrdersService.cancel(orderId),
    onSuccess: () => {
      alert.success(t("cancelled", { no: orderNo }));
      qc.invalidateQueries({ queryKey: shopOrderKey(orderId) });
      qc.invalidateQueries({ queryKey: shopOrderPaymentPageKey(orderId) });
      qc.invalidateQueries({ queryKey: shopOrdersKey });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("cancelFailed")),
  });
  const onClick = async () => {
    const ok = await confirmAlert(
      paid
        ? t("cancelConfirmPaid")
        : t("cancelConfirm"),
      { title: t("cancelTitle", { no: orderNo }), confirmText: t("cancelOrder"), cancelText: t("keepOrder"), danger: true },
    );
    if (ok) cancel.mutate();
  };
  return (
    <button type="button" onClick={() => void onClick()} disabled={cancel.isPending}
      className="rounded-xl border border-red-600/30 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50">
      {cancel.isPending ? t("cancelling") : t("cancelOrder")}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span className="font-semibold text-[#4A342E]">{value}</span>
    </div>
  );
}
