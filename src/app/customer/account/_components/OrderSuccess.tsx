"use client";
// ─────────────────────────────────────────────────────────────
// หน้า "สั่งซื้อสำเร็จ" — ขั้นที่ 4 ของแถบขั้นตอน (BACKLOG4 U8 · ตาม FrontOffice customer/order/success)
//   /customer/account/purchases/[id]/success · /customer/account/preorders/[id]/success
// มาจากหน้ารายละเอียด (?new=1) หลังส่งสลิป หรือกด "ชำระภายหลัง" — แสดงสถานะตามจริงของเอกสาร
// ยังไม่ชำระ → ปุ่มกลับไปชำระ (หน้ารายละเอียดมี QR + แนบสลิป)
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { shopOrdersService } from "@/services/shopOrders";
import { shopPreordersService } from "@/services/shopPreorders";
import { isApiError } from "@/types/api";
import { formatDate } from "@/i18n/format";
import FlowSteps from "@/components/customer/FlowSteps";
import { baht, shopButton, shopButtonPrimary, shopCard, shopPage } from "@/components/customer/shopStyles";
import { shopOrderKey, shopPreorderKey } from "../../lib/shopQueries";
import { useOrderLabels } from "../purchases/orderLabels";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

type Doc = {
  _id: string;
  no: string;
  order_type: "delivery" | "takeaway";
  order_status: string;
  payment_status: string;
  has_payment: boolean;
  total_amount: number;
  created_at: string;
  pickup_date: string | null;
  pickup_point_name: string | null;
};

export default function OrderSuccess({ kind, id }: { kind: "order" | "preorder"; id: string }) {
  const t = useTranslations("shop.success");
  const tc = useTranslations("shop.common");
  const labels = useOrderLabels();
  const locale = useLocale();
  const validId = isObjectId(id);
  const base = kind === "order" ? "/customer/account/purchases" : "/customer/account/preorders";

  const q = useQuery({
    queryKey: kind === "order" ? shopOrderKey(id) : shopPreorderKey(id),
    // cache เดียวกับหน้ารายละเอียด (ข้อมูลเต็มของออเดอร์/พรีออเดอร์) — select ย่อเหลือที่หน้านี้ใช้
    queryFn: (): Promise<unknown> => (kind === "order" ? shopOrdersService.get(id) : shopPreordersService.get(id)),
    enabled: validId,
    retry: (count, e) => !(isApiError(e) && [403, 404].includes(e.status)) && count < 2,
    select: (raw): Doc => {
      const r = raw as Omit<Doc, "no"> & { order_no?: string; preorder_no?: string };
      return { ...r, no: r.order_no ?? r.preorder_no ?? "" };
    },
  });

  const shell = (content: React.ReactNode) => (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4">
        <FlowSteps kind={kind} current={4} />
        <div className={`${shopCard} space-y-5 text-center`}>{content}</div>
      </div>
    </div>
  );

  if (validId && q.isLoading) return shell(<p className="py-6 text-sm font-medium text-[#8C5A3C]">{tc("loadingDots")}</p>);

  const d = q.data;
  if (!validId || !d) {
    return shell(
      <>
        <h1 className="text-xl font-bold">{t("notFound")}</h1>
        <p className="text-sm text-gray-500">{t("notFoundHint")}</p>
        <Link href={base} className={`${shopButton} w-full`}>{t("history")}</Link>
      </>,
    );
  }

  const cancelled = d.order_status === "cancelled";
  const paid = d.payment_status === "paid";
  const slipSent = d.has_payment && d.payment_status !== "failed";
  const awaitingPayment = !cancelled && !paid && !slipSent && d.payment_status !== "refunded";
  const statusText = cancelled
    ? labels.orderStatus("cancelled")
    : paid || d.payment_status === "refunded"
      ? labels.paymentStatus(d.payment_status as "paid" | "refunded")
      : slipSent
        ? t("slipSent")
        : t("awaitingPayment");

  return shell(
    <>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${cancelled ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
        {cancelled ? <AlertTriangle className="h-8 w-8" aria-hidden="true" /> : <CheckCircle2 className="h-8 w-8" aria-hidden="true" />}
      </div>
      <h1 className="text-2xl font-extrabold">{cancelled ? t("cancelledTitle") : t("title")}</h1>
      <p className="text-sm text-gray-600">{t(kind === "order" ? "savedOrder" : "savedPreorder", { no: d.no })}</p>

      {paid ? (
        <p className="text-sm font-medium text-emerald-600">{t("paidHint")}</p>
      ) : slipSent && !cancelled ? (
        <p className="text-sm font-medium text-amber-600">{t("slipSentHint")}</p>
      ) : null}

      <dl className="m-0 space-y-2 rounded-xl bg-[#FAF6F0] p-4 text-left text-sm">
        <Row label={t("total")} value={<strong>{baht(d.total_amount)}</strong>} />
        <Row label={t("method")} value={d.order_type === "delivery" ? t("delivery") : t("pickup")} />
        {d.order_type === "takeaway" && d.pickup_date && <Row label={t("pickupDate")} value={<span className="font-semibold">{labels.pickupDate(d.pickup_date)}</span>} />}
        {d.order_type === "takeaway" && d.pickup_point_name && <Row label={t("pickupPoint")} value={d.pickup_point_name} />}
        <Row label={t("orderedAt")} value={formatDate(d.created_at, locale, { withTime: true })} />
        <Row label={t("status")} value={statusText} />
      </dl>

      {awaitingPayment && (
        <div className="space-y-2">
          <Link href={`${base}/${d._id}`} className={`${shopButtonPrimary} w-full`}>{t("payNow")}</Link>
          <p className="m-0 text-xs text-red-600">{t(kind === "order" ? "payDeadline" : "payDeadlinePreorder")}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Link href={base} className={`${shopButton} w-full sm:flex-1`}>{t("history")}</Link>
        <Link href="/customer" className={`${shopButton} w-full sm:flex-1`}>{t("home")}</Link>
      </div>
    </>,
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="m-0 text-right">{value}</dd>
    </div>
  );
}
