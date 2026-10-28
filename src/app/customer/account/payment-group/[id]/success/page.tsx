"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/payment-group/[id]/success — สั่งซื้อสำเร็จ (ขั้นที่ 4) ของการชำระรวมหลายบิล
// มาจากหน้าชำระรวมหลังส่งสลิป หรือกด "ชำระภายหลัง" — สรุปทุกบิล (เลขบิล · ยอด · สถานะ) + ยอดรวม ตามสถานะจริง
// หน้าตาเดียวกับ _components/OrderSuccess (ชำระบิลเดียว) · ยังไม่ชำระ → ปุ่มกลับไปชำระที่หน้าชำระรวม
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { billHref, paymentGroupHref } from "@/services/shopCheckout";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import FlowSteps from "@/components/customer/FlowSteps";
import { baht, shopButton, shopButtonPrimary, shopCard, shopPage } from "@/components/customer/shopStyles";
import { BillStatus, isObjectId, usePaymentGroup } from "../groupShared";

export default function PaymentGroupSuccessRoute() {
  const t = useTranslations("shop.paymentGroup");
  return (
    <CustomerAuthGate message={t("loginToPay")}>
      <PaymentGroupSuccess />
    </CustomerAuthGate>
  );
}

function PaymentGroupSuccess() {
  const t = useTranslations("shop.success");
  const tg = useTranslations("shop.paymentGroup");
  const tc = useTranslations("shop.common");
  const { id } = useParams<{ id: string }>();
  const valid = isObjectId(id ?? "");
  const { q } = usePaymentGroup(id, valid);

  const shell = (content: React.ReactNode) => (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4">
        <FlowSteps current={4} />
        <div className={`${shopCard} space-y-5 text-center`}>{content}</div>
      </div>
    </div>
  );

  if (valid && q.isLoading) return shell(<p className="py-6 text-sm font-medium text-[#8C5A3C]">{tc("loadingDots")}</p>);

  const page = q.data;
  if (!valid || !page) {
    return shell(
      <>
        <h1 className="text-xl font-bold">{t("notFound")}</h1>
        <p className="text-sm text-gray-500">{t("notFoundHint")}</p>
        <Link href="/customer/account/purchases" className={`${shopButton} w-full`}>{t("history")}</Link>
      </>,
    );
  }

  const allCancelled = page.bills.every((b) => b.order_status === "cancelled");
  const paid = page.status === "paid";
  const slipSent = page.status === "awaiting_review";
  // ยังชำระรวมได้ (ยังไม่ส่งสลิป) — split แล้วให้ไปชำระแยกที่หน้าชำระรวม (มีลิงก์ต่อบิล)
  const awaitingPayment = !allCancelled && !paid && !slipSent;
  const statusText = allCancelled ? tg("allCancelled") : paid ? tg("paidShort") : slipSent ? t("slipSent") : t("awaitingPayment");

  return shell(
    <>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${allCancelled ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
        {allCancelled ? <AlertTriangle className="h-8 w-8" aria-hidden="true" /> : <CheckCircle2 className="h-8 w-8" aria-hidden="true" />}
      </div>
      <h1 className="text-2xl font-extrabold">{allCancelled ? t("cancelledTitle") : t("title")}</h1>
      <p className="text-sm text-gray-600">{tg("savedBills", { n: page.bills.length })}</p>

      {paid ? (
        <p className="text-sm font-medium text-emerald-600">{t("paidHint")}</p>
      ) : slipSent ? (
        <p className="text-sm font-medium text-amber-600">{t("slipSentHint")}</p>
      ) : null}

      {/* สรุปทุกบิล — กดเลขบิลดูรายละเอียด */}
      <ul className="m-0 list-none space-y-2 rounded-xl bg-[#FAF6F0] p-4 text-left text-sm">
        {page.bills.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Link href={billHref(b)} className="block truncate font-semibold text-[#4A342E] hover:text-[#8C5A3C] hover:underline">
                {b.kind === "order" ? tg("billOrder", { no: b.doc_no }) : tg("billPreorder", { no: b.doc_no })}
              </Link>
              <BillStatus b={b} />
            </div>
            <span className="shrink-0 font-bold text-[#4A342E]">{baht(b.amount)}</span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-3 border-t border-[#8C5A3C]/15 pt-2">
          <span className="font-bold text-[#4A342E]">{tg("total")}</span>
          <strong className="text-lg text-[#8C5A3C]">{baht(page.total_amount)}</strong>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-gray-500">{t("status")}</span>
          <span className="text-right">{statusText}</span>
        </li>
      </ul>

      {awaitingPayment && (
        <div className="space-y-2">
          <Link href={paymentGroupHref(page._id)} className={`${shopButtonPrimary} w-full`}>{t("payNow")}</Link>
          <p className="m-0 text-xs text-red-600">{t("payDeadline")}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Link href="/customer/account/purchases" className={`${shopButton} w-full sm:flex-1`}>{t("history")}</Link>
        <Link href="/customer" className={`${shopButton} w-full sm:flex-1`}>{t("home")}</Link>
      </div>
    </>,
  );
}
