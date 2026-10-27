"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/payment-group/[id] — ชำระรวมหลายบิล (ตะกร้ารวม 2026-10-27)
// สั่งซื้อรวมได้หลายบิล (สินค้าปกติ 1 + พรีออเดอร์ 1 ต่อรอบ) → โอนยอดรวมครั้งเดียว (QR ยอดรวม) + แนบสลิปเดียว
// GET /shop/payment-groups/{id} · POST /shop/payment-groups/{id}/slip
// ชำระรวมได้เฉพาะตอนทุกบิลยังรอชำระ — มีบิลยกเลิก/หมดเวลา/ชำระแล้ว (split) = ลิงก์ไปชำระแยกที่หน้าบิล
// ขั้นตอนเดียวกับชำระบิลเดียว (purchases/[id]): ?new=1 (มาจากหน้ายืนยัน) = แถบขั้นตอน + แถบ "สั่งซื้อสำเร็จ" + ชำระภายหลัง
//   การ์ดชำระเงินใช้ PaymentCard ตัวเดียวกัน · ส่งสลิปสำเร็จ → ./success (ขั้นที่ 4 + สรุปทุกบิล)
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FaCheckCircle } from "react-icons/fa";
import { paymentGroupHref, shopCheckoutService, type PaymentGroupPage } from "@/services/shopCheckout";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import FlowSteps from "@/components/customer/FlowSteps";
import ShopSpinner from "@/components/customer/ShopSpinner";
import { shopButton, shopCard, shopPage } from "@/components/customer/shopStyles";
import { shopOrdersKey, shopPreordersKey } from "../../../lib/shopQueries";
import { PayCard, PayQr, SlipDropzone, useSecondsLeft, useSlipFile } from "../../_components/PaymentCard";
import { isObjectId, usePaymentGroup } from "./groupShared";
import GroupBillsDetail from "./GroupBillsDetail";

export default function PaymentGroupRoute() {
  const t = useTranslations("shop.paymentGroup");
  return (
    <CustomerAuthGate message={t("loginToPay")}>
      <PaymentGroupContent />
    </CustomerAuthGate>
  );
}

function PaymentGroupContent() {
  const t = useTranslations("shop.paymentGroup");
  const to = useTranslations("shop.orders");
  const tf = useTranslations("shop.flow");
  const tc = useTranslations("shop.common");
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get("new") === "1";
  const valid = isObjectId(id ?? "");
  const { q, fetchedAt } = usePaymentGroup(id, valid);

  if (!valid || (q.isError && isApiError(q.error) && q.error.status === 404)) {
    return (
      <div className={`${shopPage} flex items-center justify-center px-4`}>
        <div className={`${shopCard} w-full max-w-md space-y-4 text-center`}>
          <p className="font-bold">{t("notFound")}</p>
          <Link href="/customer/account/purchases" className={shopButton}>{t("viewOrders")}</Link>
        </div>
      </div>
    );
  }
  if (q.isLoading || !q.data) {
    return (
      <div className={`${shopPage} flex items-center justify-center`}>
        {q.isError ? <p className="text-sm text-red-700">{t("loadFailed")}</p> : <ShopSpinner label={tc("loading")} />}
      </div>
    );
  }

  const page = q.data;
  const successHref = `${paymentGroupHref(page._id)}/success`;
  const slipSentOrPaid = page.status === "paid" || page.status === "awaiting_review";
  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb
          items={[
            { label: to("myAccount"), href: "/customer/account" },
            { label: t("crumb"), href: "/customer/account/purchases" },
            { label: t("title", { n: page.bills.length }) },
          ]}
          className="!mb-0"
        />

        {/* เหมือนชำระบิลเดียว: เพิ่งสั่ง = แถบขั้นตอน + แถบสั่งซื้อสำเร็จ (ชำระภายหลังได้) */}
        {isNew && <FlowSteps current={slipSentOrPaid ? 4 : 3} />}
        {isNew && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            <FaCheckCircle className="shrink-0 text-2xl" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{to("placed")}</p>
              <p className="text-sm">{t("placedHint", { n: page.bills.length })}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
          {/* รายละเอียดทุกบิล — แบบเดียวกับหน้าชำระบิลเดียว (ข้อมูลที่ซ้ำกันแสดงครั้งเดียว) */}
          <GroupBillsDetail page={page} />

          {/* ชำระเงิน — การ์ดเดียวกับชำระบิลเดียว */}
          <PayPanel page={page} fetchedAt={fetchedAt} refetch={q.refetch} successHref={successHref} />
        </div>

        {/* ขั้นชำระเงิน (เพิ่งสั่ง · ยังไม่ส่งสลิป) — ชำระภายหลัง (ไปหน้าสั่งซื้อสำเร็จ) / กลับหน้าหลัก */}
        <div className="flex flex-wrap justify-center gap-2">
          {isNew && page.status === "awaiting_payment" ? (
            <>
              <Link href={successHref} className={shopButton}>{tf("payLaterBtn")}</Link>
              <Link href="/customer" className={shopButton}>{tf("backHome")}</Link>
            </>
          ) : (
            <Link href="/customer/account/purchases" className={shopButton}>{t("viewOrders")}</Link>
          )}
        </div>
      </div>
    </div>
  );
}

function PayPanel({
  page,
  fetchedAt,
  refetch,
  successHref,
}: {
  page: PaymentGroupPage;
  fetchedAt: number;
  refetch: () => Promise<unknown>;
  successHref: string;
}) {
  const t = useTranslations("shop.paymentGroup");
  const ts = useTranslations("shop.slip");
  const qc = useQueryClient();
  const router = useRouter();
  const slip = useSlipFile();
  const secondsLeft = useSecondsLeft(page.payment_due_at, page.server_time, fetchedAt);
  const expiredNow = page.can_pay_together && secondsLeft === 0;

  // ครบกำหนดตอนเปิดหน้าอยู่ → ถาม backend ใหม่ (ยกเลิกบิลที่หมดเวลา → ชำระรวมไม่ได้แล้ว)
  useEffect(() => {
    if (expiredNow) void refetch();
  }, [expiredNow, refetch]);

  const upload = useMutation({
    mutationFn: (file: File) => shopCheckoutService.uploadGroupSlip(page._id, file),
    onSuccess: () => {
      alert.success(t("sent"));
      slip.pick(null);
      void refetch();
      void qc.invalidateQueries({ queryKey: shopOrdersKey });
      void qc.invalidateQueries({ queryKey: shopPreordersKey });
      // ส่งสลิปแล้ว = ขั้นตอนสั่งซื้อสำเร็จ + สรุปทุกบิล
      router.push(successHref);
    },
    onError: (e) => {
      alert.error(isApiError(e) ? e.message : ts("sendFailed"));
      void refetch();
    },
  });

  const showTimer = page.can_pay_together && page.status === "awaiting_payment" && secondsLeft !== null;
  const card = (body: React.ReactNode) => (
    <PayCard title={ts("title")} sub={t("payOnceSub")} secondsLeft={showTimer ? secondsLeft : null} className="lg:sticky lg:top-44 lg:col-span-2">
      <div className="space-y-5 p-4 sm:p-5">{body}</div>
    </PayCard>
  );

  if (page.status === "paid") {
    return card(
      <div className="flex items-center gap-3 text-emerald-800">
        <FaCheckCircle className="shrink-0 text-3xl" aria-hidden="true" />
        <p className="m-0 text-sm font-semibold">{t("paid")}</p>
      </div>,
    );
  }
  if (page.status === "awaiting_review" || !page.can_pay_together) {
    return card(
      <p className="m-0 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{page.status === "awaiting_review" ? t("awaitingReview") : t("split")}</p>,
    );
  }

  return card(
    <>
      <PayQr qr={page.qr_image} accountName={page.account_name} amount={page.total_amount} scanText={t("scanOnce")} />
      <SlipDropzone
        label={t("attachOne")}
        preview={slip.preview}
        pending={upload.isPending}
        disabled={!slip.file || expiredNow}
        onPick={slip.pick}
        onSend={() => slip.file && upload.mutate(slip.file)}
      />
    </>,
  );
}
