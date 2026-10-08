"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/preorders/[id] — รายละเอียดพรีออเดอร์ + ชำระเงิน (BACKLOG3-merge D3)
// ยกจาก FrontOffice customer/account/preorders/[id] (+ /payment = SlipPaymentView) — รวมเป็นหน้าเดียวแบบหน้าออเดอร์ (D1)
// GET /shop/preorders/{id} · ชำระเงิน GET /shop/preorders/{id}/payment + SlipPaymentPanel (ตัวเดียวกับออเดอร์)
// ยกเลิก: POST /shop/preorders/{id}/cancel — pending/confirmed ที่ยังไม่ชำระเท่านั้น (ชำระแล้วต้องติดต่อร้าน)
// ?new=1 = เพิ่งสั่งจากหน้า checkout พรีออเดอร์
// ─────────────────────────────────────────────────────────────
import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCheckCircle } from "react-icons/fa";
import { canCustomerCancelPreorder, shopPreordersService } from "@/services/shopPreorders";
import { shopPaymentsService } from "@/services/shopPayments";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { baht, shopButton, shopButtonPrimary, shopCard, shopPage } from "@/components/customer/shopStyles";
import SlipPaymentPanel from "../../_components/SlipPaymentPanel";
import ReviewLink from "../../_components/ReviewLink";
import { shopPointsKey, shopCouponsKey, shopPreorderKey, shopPreorderPaymentPageKey, shopPreordersKey } from "../../../lib/shopQueries";
import { useOrderLabels } from "../../purchases/orderLabels";
import { thaiDate } from "../../../preorder/lib/preorderDates";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

export default function PreorderDetailPage() {
  const t = useTranslations("shop.preorders");
  return (
    <CustomerAuthGate message={t("loginToViewOne")}>
      <Suspense fallback={null}>
        <PreorderDetailContent />
      </Suspense>
    </CustomerAuthGate>
  );
}

function PreorderDetailContent() {
  const t = useTranslations("shop.preorders");
  const { name: localName } = useLocalName();
  const to = useTranslations("shop.orders");
  const tc = useTranslations("shop.common");
  const labels = useOrderLabels();
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get("new") === "1";
  const validId = isObjectId(id ?? "");
  const qc = useQueryClient();

  const preorderQ = useQuery({
    queryKey: shopPreorderKey(id),
    queryFn: () => shopPreordersService.get(id),
    enabled: validId,
    retry: (count, e) => !(isApiError(e) && [403, 404].includes(e.status)) && count < 2,
  });
  const paymentQ = useQuery({
    queryKey: shopPreorderPaymentPageKey(id),
    queryFn: () => shopPaymentsService.preorderPaymentPage(id),
    enabled: validId && preorderQ.isSuccess,
  });
  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: shopPreorderPaymentPageKey(id) });
    void qc.invalidateQueries({ queryKey: shopPreorderKey(id) });
    void qc.invalidateQueries({ queryKey: shopPreordersKey });
  }, [qc, id]);

  const cancel = useMutation({
    mutationFn: () => shopPreordersService.cancel(id),
    onSuccess: () => {
      alert.success(t("cancelled"));
      refresh();
      void qc.invalidateQueries({ queryKey: shopPointsKey }); // คืนแต้ม/คูปองที่ใช้
      void qc.invalidateQueries({ queryKey: shopCouponsKey });
      void qc.invalidateQueries({ queryKey: ["catalog", "preorder-rounds"] }); // คืนโควตาในรอบ
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("cancelFailed")),
  });

  if (validId && (preorderQ.isLoading || paymentQ.isLoading)) {
    return (
      <div className={`${shopPage} flex items-center justify-center`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label={tc("loading")} />
      </div>
    );
  }

  const p = preorderQ.data;
  if (!validId || !p) {
    return (
      <div className={`${shopPage} flex items-center justify-center px-4`}>
        <div className={`${shopCard} w-full max-w-md space-y-4 text-center`}>
          <h2 className="text-lg font-bold">{t("notFound")}</h2>
          <Link href="/customer/account/preorders" className={`${shopButtonPrimary} w-full`}>{t("viewAll")}</Link>
        </div>
      </div>
    );
  }

  const onCancel = async () => {
    const ok = await confirmAlert(t("cancelConfirm"), {
      title: t("cancelTitle", { no: p.preorder_no }),
      confirmText: t("cancelPreorder"),
      cancelText: to("keepOrder"),
      danger: true,
    });
    if (ok) cancel.mutate();
  };

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb
          items={[{ label: to("myAccount"), href: "/customer/account" }, { label: t("history"), href: "/customer/account/preorders" }, { label: p.preorder_no }]}
          className="!mb-0"
        />

        {isNew && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            <FaCheckCircle className="shrink-0 text-2xl" />
            <div>
              <p className="font-bold">{t("placed")}</p>
              <p className="text-sm">{t("placedHint")}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
          <section className={`${shopCard} space-y-4 lg:col-span-3`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-gray-500">{t("noLabel")}</p>
                <h1 className="text-xl font-extrabold">{p.preorder_no}</h1>
                <p className="text-xs text-gray-500">{thaiDate(p.created_at, true, locale)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs font-semibold">
                <span className="rounded-full bg-[#8C5A3C]/10 px-2.5 py-1 text-[#8C5A3C]">{labels.orderStatus(p.order_status)}</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{labels.paymentStatus(p.payment_status)}</span>
              </div>
            </div>

            {p.round && (
              <p className="rounded-xl bg-[#FAF6F0] p-3 text-sm text-gray-700">
                {t("round")} <Link href={`/customer/preorder/${p.round._id}`} className="font-semibold underline">{p.round.round_name}</Link>
                {t("pickupFromDate", { date: thaiDate(p.round.pickup_date, false, locale) })}
              </p>
            )}
            {p.order_status === "cancelled" && p.cancelled_reason && <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-600">{to("cancelReason", { reason: p.cancelled_reason })}</p>}
            {p.order_status === "cancelled" && p.payment_status === "paid" && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{to("refundInProgress")}</p>
            )}

            <div className="space-y-2 border-t border-[#8C5A3C]/10 pt-4">
              {p.items.map((it) => (
                <div key={it._id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    {localName(it.product_name, it.product_name_eng)}
                    {it.variant_name ? ` (${it.variant_name})` : ""} <span className="text-gray-500">×{it.quantity}</span>
                    {it.selected_options.map((o) => (
                      <span key={o.option_name} className="block text-xs text-gray-500">
                        + {o.option_name}
                        {o.text_value ? `: "${o.text_value}"` : ""}
                      </span>
                    ))}
                    {it.special_request && <span className="block text-xs text-gray-500">{t("note", { text: it.special_request })}</span>}
                  </span>
                  <span className="font-semibold">{baht(it.total_price)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 border-t border-[#8C5A3C]/10 pt-4 text-sm">
              <Row label={to("subtotal")} value={baht(p.subtotal)} />
              <Row label={to("deliveryFee")} value={p.order_type === "takeaway" ? t("pickupSelfShort") : baht(p.delivery_fee)} />
              {p.coupon_discount > 0 && <Row label={t("coupon")} value={`-${baht(p.coupon_discount)}`} />}
              {p.points_discount > 0 && <Row label={t("pointsUsed", { n: p.points_redeemed.toLocaleString() })} value={`-${baht(p.points_discount)}`} />}
              {p.discount_amount - p.coupon_discount - p.points_discount > 0.009 && <Row label={to("discount")} value={`-${baht(p.discount_amount - p.coupon_discount - p.points_discount)}`} />}
              <div className="flex items-baseline justify-between pt-2">
                <span className="font-bold">{to("amountDue")}</span>
                <span className="text-2xl font-extrabold text-[#8C5A3C]">{baht(p.total_amount)}</span>
              </div>
            </div>

            {p.order_type === "takeaway" && (p.pickup_point_name || p.pickup_date) && (
              <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
                <p className="mb-1 font-semibold">{to("pickupAppointment")}</p>
                <p className="text-gray-600">
                  {p.pickup_date ? labels.pickupDate(p.pickup_date) : ""}
                  {p.pickup_point_name ? ` · ${p.pickup_point_name}` : ""}
                </p>
              </div>
            )}
            {p.order_type === "delivery" && p.delivery_status && p.order_status !== "cancelled" && (
              <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
                <p className="mb-1 font-semibold">{to("deliveryStatus")}</p>
                <p className="text-gray-600">
                  {labels.deliveryStatus(p.delivery_status)}
                  {p.tracking_no ? to("tracking", { no: p.tracking_no }) : ""}
                </p>
              </div>
            )}
            {p.order_type === "delivery" && p.delivery_address && (
              <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
                <p className="mb-1 font-semibold">{to("deliveryAddress")}</p>
                <p>{p.delivery_address.recipient_name} · {p.delivery_address.recipient_phone}</p>
                <p className="text-gray-600">
                  {p.delivery_address.house_no} {p.delivery_address.sub_district} {p.delivery_address.district} {p.delivery_address.province} {p.delivery_address.zip_code}
                </p>
              </div>
            )}
          </section>

          <section className={`${shopCard} space-y-4 lg:col-span-2`}>
            <h2 className="text-lg font-bold">{to("payment")}</h2>
            {paymentQ.data ? (
              <SlipPaymentPanel kind="preorder" docId={p._id} page={paymentQ.data} fetchedAt={paymentQ.dataUpdatedAt} onChanged={refresh} />
            ) : (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{to("paymentLoadFailed")}</p>
            )}
          </section>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/customer/account/preorders" className={shopButton}>{t("viewAll")}</Link>
          <Link href="/customer/preorder" className={shopButton}>{t("viewRounds")}</Link>
          <ReviewLink kind="preorder" doc={p} itemIds={p.items.map((it) => it._id)} href={`/customer/account/preorders/${p._id}/review`} className={shopButtonPrimary} />
          {canCustomerCancelPreorder(p) && (
            <button type="button" onClick={() => void onCancel()} disabled={cancel.isPending}
              className="rounded-xl border border-red-600/30 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50">
              {cancel.isPending ? to("cancelling") : t("cancelPreorder")}
            </button>
          )}
        </div>
        {p.payment_status === "paid" && p.order_status !== "cancelled" && p.order_status !== "completed" && (
          <p className="m-0 text-center text-xs text-gray-500">{t("paidContactToCancel")}</p>
        )}
      </div>
    </div>
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
