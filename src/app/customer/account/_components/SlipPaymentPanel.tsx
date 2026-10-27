"use client";
// ─────────────────────────────────────────────────────────────
// ชำระเงิน + แนบสลิป — ใช้ร่วมกันหน้าออเดอร์ (purchases/[id]) และพรีออเดอร์ (preorders/[id])
// หน้าตาเดียวกับหน้าชำระรวมหลายบิล (PaymentCard: หัวการ์ด + นาฬิกา · QR · กล่องแนบสลิป) — 2026-10-27
// GET /shop/{orders|preorders}/{id}/payment (QR พร้อมเพย์จาก backend + กำหนดชำระ) → แนบสลิป:
//   มีรายการชำระเงินที่ pending/failed อยู่แล้ว = แนบกับใบเดิม · ยังไม่มี = POST /shop/payments ก่อน
//   แล้ว POST /shop/payments/{id}/slip (multipart — backend PR #54)
// ออเดอร์หมดเวลาแล้ว (late_upload) = แนบสลิปกับใบเดิม หรือสร้างใบพร้อมสลิป (POST /shop/payments multipart) เพื่อเปิดกลับ · พรีออเดอร์ไม่มี late_upload (backend ยกเลิกแล้วจบ)
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { FaCheckCircle } from "react-icons/fa";
import { shopPaymentsService, type PaymentKind, type ShopPaymentPage } from "@/services/shopPayments";
import { paymentGroupHref } from "@/services/shopCheckout";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { formatDate } from "@/i18n/format";
import { PayCard, PayQr, SlipDropzone, useSecondsLeft, useSlipFile } from "./PaymentCard";

export default function SlipPaymentPanel({
  kind,
  docId,
  page,
  fetchedAt,
  onChanged,
  onUploaded,
  className = "",
}: {
  kind: PaymentKind;
  docId: string;
  page: ShopPaymentPage;
  fetchedAt: number;
  /** ให้หน้าที่ใช้โหลดข้อมูลเอกสาร + หน้าชำระเงินใหม่ */
  onChanged: () => void;
  /** ส่งสลิปสำเร็จ (หลัง onChanged) — หน้ารายละเอียดใช้พาไปหน้าสั่งซื้อสำเร็จตอนเพิ่งสั่ง (U8) */
  onUploaded?: () => void;
  /** class ของการ์ด (ตำแหน่งใน grid ของหน้าที่ใช้) */
  className?: string;
}) {
  const t = useTranslations("shop.slip");
  const locale = useLocale();
  const slip = useSlipFile();

  const paid = page.payment_status === "paid" || page.payment_record_status === "paid";
  const awaitingReview = page.payment_record_status === "pending" && !!page.slip_url;
  const rejected = page.payment_record_status === "failed";
  // แนบกับรายการเดิมได้ (pending/failed) · หมดเวลาแล้วและยังไม่มีใบ = สร้างใบพร้อมสลิปในคำขอเดียว (createWithSlip)
  const reusablePaymentId =
    page.payment_id && (page.payment_record_status === "pending" || page.payment_record_status === "failed") ? page.payment_id : null;
  const canUpload = page.can_pay || page.late_upload;

  const secondsLeft = useSecondsLeft(page.payment_due_at, page.server_time, fetchedAt);
  const showCountdown = !paid && page.can_pay && !awaitingReview && secondsLeft !== null;
  const expiredNow = showCountdown && secondsLeft === 0;

  // ครบกำหนดตอนเปิดหน้าอยู่ → ถาม backend ใหม่ (ออเดอร์: backend ยกเลิกให้ตอนเปิดหน้าชำระเงิน · พรีออเดอร์: cron)
  useEffect(() => {
    if (expiredNow) onChanged();
  }, [expiredNow, onChanged]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (reusablePaymentId) return shopPaymentsService.uploadSlip(reusablePaymentId, file);
      // หมดเวลาแล้ว: สร้างใบแบบไม่มีสลิปไม่ได้ (400) → ส่งสลิปไปพร้อมการสร้าง
      if (page.late_upload) return shopPaymentsService.createWithSlip(kind, docId, page.amount, file);
      const paymentId = (await shopPaymentsService.create(kind, docId, page.amount))._id;
      return shopPaymentsService.uploadSlip(paymentId, file);
    },
    onSuccess: () => {
      alert.success(page.late_upload ? t("sentReopen") : t("sent"));
      slip.pick(null);
      onChanged();
      onUploaded?.();
    },
    onError: (e) => {
      alert.error(isApiError(e) ? e.message : t("sendFailed"));
      // อาจมีรายการชำระเงินถูกสร้างไปแล้วก่อนอัปโหลดพัง — โหลดใหม่ให้รอบหน้าแนบกับใบเดิม
      onChanged();
    },
  });

  const card = (body: React.ReactNode) => (
    <PayCard title={t("title")} sub={t("sub")} secondsLeft={showCountdown ? secondsLeft : null} className={className}>
      <div className="space-y-5 p-4 sm:p-5">{body}</div>
    </PayCard>
  );

  if (paid) {
    return card(
      <div className="flex items-center gap-3 text-emerald-800">
        <FaCheckCircle className="shrink-0 text-3xl" aria-hidden="true" />
        <p className="m-0 text-sm font-semibold">{t("paid")}</p>
      </div>,
    );
  }

  if (!canUpload) {
    return card(<p className="m-0 rounded-xl bg-red-50 p-4 text-sm text-red-700">{t("blocked", { reason: page.blocked_reason ?? t("blockedDefault") })}</p>);
  }

  return card(
    <>
      {/* สั่งพร้อมบิลอื่น — โอนครั้งเดียวที่หน้าชำระรวมสะดวกกว่า (ยังชำระแยกบิลนี้ได้) */}
      {page.group_id && page.can_pay && !awaitingReview && (
        <Link href={paymentGroupHref(page.group_id)} className="block rounded-xl border border-[#8C5A3C]/30 bg-[#FAF6F0] p-3 text-sm font-semibold text-[#4A342E] hover:bg-white">
          {t("groupHint")} <span className="text-[#8C5A3C] underline">{t("groupLink")}</span>
        </Link>
      )}
      {page.late_upload && <p className="m-0 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t("lateUpload")}</p>}
      {awaitingReview && <p className="m-0 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{t("awaitingReview")}</p>}
      {rejected && <p className="m-0 rounded-xl bg-red-50 p-3 text-sm text-red-700">{t("rejected")}</p>}
      {/* พรีออเดอร์กำหนดชำระยาว — บอกวันเวลาเต็มใต้หัวการ์ด (นาฬิกาบนหัวบอกเวลาที่เหลือ) */}
      {showCountdown && kind === "preorder" && page.payment_due_at && (
        <p className="m-0 text-center text-xs text-stone-500">{t("dueAt", { date: formatDate(page.payment_due_at, locale, { withTime: true }) })}</p>
      )}

      {page.can_pay && !awaitingReview && <PayQr qr={page.qr_image} accountName={page.account_name} amount={page.amount} scanText={t("scan")} />}

      <SlipDropzone
        label={awaitingReview ? t("attachNew") : t("attach")}
        preview={slip.preview}
        pending={uploadMutation.isPending}
        disabled={!slip.file || expiredNow}
        onPick={slip.pick}
        onSend={() => slip.file && uploadMutation.mutate(slip.file)}
      />
    </>,
  );
}
