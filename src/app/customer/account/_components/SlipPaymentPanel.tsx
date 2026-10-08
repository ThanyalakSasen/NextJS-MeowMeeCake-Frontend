"use client";
// ─────────────────────────────────────────────────────────────
// ชำระเงิน + แนบสลิป — ใช้ร่วมกันหน้าออเดอร์ (purchases/[id]) และพรีออเดอร์ (preorders/[id])
// (FrontOffice แยกเป็น SlipPaymentView ตัวเดียวกันทั้งสองแบบ — แยกออกจากหน้าออเดอร์ตอนทำ D3)
// GET /shop/{orders|preorders}/{id}/payment (QR พร้อมเพย์จาก backend + กำหนดชำระ) → แนบสลิป:
//   มีรายการชำระเงินที่ pending/failed อยู่แล้ว = แนบกับใบเดิม · ยังไม่มี = POST /shop/payments ก่อน
//   แล้ว POST /shop/payments/{id}/slip (multipart — backend PR #54)
// ออเดอร์หมดเวลาแล้ว (late_upload) = แนบสลิปกับใบเดิมเพื่อเปิดกลับ · พรีออเดอร์ไม่มี late_upload (backend ยกเลิกแล้วจบ)
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { FaCheckCircle } from "react-icons/fa";
import { shopPaymentsService, type PaymentKind, type ShopPaymentPage } from "@/services/shopPayments";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { formatDate } from "@/i18n/format";
import { baht, shopButtonPrimary } from "@/components/customer/shopStyles";

const SLIP_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const SLIP_MAX_BYTES = 5 * 1024 * 1024;

/** วินาทีที่เหลือก่อนหมดเขตชำระ — ชดเชยนาฬิกาเครื่องลูกค้าด้วย server_time (null = ไม่มีกำหนด) */
function useSecondsLeft(page: ShopPaymentPage, fetchedAt: number): number | null {
  const [now, setNow] = useState(() => Date.now());
  const due = page.payment_due_at ? new Date(page.payment_due_at).getTime() : null;
  const offset = new Date(page.server_time).getTime() - fetchedAt;

  useEffect(() => {
    if (due === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [due]);

  return due === null ? null : Math.max(0, Math.floor((due - (now + offset)) / 1000));
}

/** ออเดอร์ (30 นาที) = "29:59 นาที" · พรีออเดอร์ (ถึง 24 ชม.) = "23 ชม. 59 นาที" */
function timeLeftText(sec: number, t: ReturnType<typeof useTranslations<"shop.slip">>): string {
  if (sec < 3600) return t("minSec", { mm: String(Math.floor(sec / 60)).padStart(2, "0"), ss: String(sec % 60).padStart(2, "0") });
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h >= 48 ? t("daysHours", { d: Math.floor(h / 24), h: h % 24 }) : t("hoursMins", { h, m });
}

export default function SlipPaymentPanel({
  kind,
  docId,
  page,
  fetchedAt,
  onChanged,
}: {
  kind: PaymentKind;
  docId: string;
  page: ShopPaymentPage;
  fetchedAt: number;
  /** ให้หน้าที่ใช้โหลดข้อมูลเอกสาร + หน้าชำระเงินใหม่ */
  onChanged: () => void;
}) {
  const t = useTranslations("shop.slip");
  const locale = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const paid = page.payment_status === "paid" || page.payment_record_status === "paid";
  const awaitingReview = page.payment_record_status === "pending" && !!page.slip_url;
  const rejected = page.payment_record_status === "failed";
  // แนบกับรายการเดิมได้ (pending/failed) — หมดเวลาแล้วต้องแนบกับใบเดิมเท่านั้น (สร้างใบใหม่แบบไม่มีสลิป = 400)
  const reusablePaymentId =
    page.payment_id && (page.payment_record_status === "pending" || page.payment_record_status === "failed") ? page.payment_id : null;
  const canUpload = page.can_pay || (page.late_upload && !!reusablePaymentId);

  const secondsLeft = useSecondsLeft(page, fetchedAt);
  const showCountdown = page.can_pay && !awaitingReview && secondsLeft !== null;
  const expiredNow = showCountdown && secondsLeft === 0;

  // ครบกำหนดตอนเปิดหน้าอยู่ → ถาม backend ใหม่ (ออเดอร์: backend ยกเลิกให้ตอนเปิดหน้าชำระเงิน · พรีออเดอร์: cron)
  useEffect(() => {
    if (expiredNow) onChanged();
  }, [expiredNow, onChanged]);

  const pickFile = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    if (f && !SLIP_TYPES.includes(f.type)) {
      alert.error(t("badType"));
      f = null;
    } else if (f && f.size > SLIP_MAX_BYTES) {
      alert.error(t("tooBig"));
      f = null;
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const uploadMutation = useMutation({
    mutationFn: async (slip: File) => {
      const paymentId = reusablePaymentId ?? (await shopPaymentsService.create(kind, docId, page.amount))._id;
      return shopPaymentsService.uploadSlip(paymentId, slip);
    },
    onSuccess: () => {
      alert.success(page.late_upload ? t("sentReopen") : t("sent"));
      pickFile(null);
      onChanged();
    },
    onError: (e) => {
      alert.error(isApiError(e) ? e.message : t("sendFailed"));
      // อาจมีรายการชำระเงินถูกสร้างไปแล้วก่อนอัปโหลดพัง — โหลดใหม่ให้รอบหน้าแนบกับใบเดิม
      onChanged();
    },
  });

  if (paid) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-800">
        <FaCheckCircle className="shrink-0 text-2xl" />
        <p className="text-sm font-semibold">{t("paid")}</p>
      </div>
    );
  }

  if (page.late_upload && !reusablePaymentId) {
    // backend ยังไม่มีทางอัปโหลดสลิปโดยไม่มีรายการชำระเงิน (POST /shop/payments ไม่มีสลิป = 400) — BACKLOG4 Q-BE1
    return (
      <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        {t("expiredCancelled")}
      </p>
    );
  }

  if (!canUpload) {
    return (
      <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        {t("blocked", { reason: page.blocked_reason ?? t("blockedDefault") })}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {page.late_upload && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {t("lateUpload")}
        </p>
      )}
      {awaitingReview && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t("awaitingReview")}</p>}
      {rejected && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{t("rejected")}</p>}
      {showCountdown && (
        <p className={`rounded-xl p-3 text-center text-sm ${secondsLeft < 300 ? "bg-red-50 text-red-700" : "bg-[#FAF6F0] text-gray-700"}`}>
          {t("payWithin")} <span className="font-mono text-base font-bold">{timeLeftText(secondsLeft, t)}</span>
          {kind === "preorder" && page.payment_due_at && (
            <span className="mt-1 block text-xs text-gray-500">
              {t("dueAt", { date: formatDate(page.payment_due_at, locale, { withTime: true }) })}
            </span>
          )}
        </p>
      )}

      {page.can_pay &&
        !awaitingReview &&
        (page.qr_image ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-[240px] w-[240px] items-center justify-center rounded-2xl border border-[#8C5A3C]/15 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.qr_image} alt={t("qrAlt")} width={230} height={230} />
            </div>
            <p className="text-sm text-gray-600">{t("scan")}</p>
            {page.account_name && (
              <p className="text-sm">
                {t("accountName")} <span className="font-semibold">{page.account_name}</span>
              </p>
            )}
            <p className="text-2xl font-extrabold text-[#8C5A3C]">{baht(page.amount)}</p>
          </div>
        ) : (
          <p className="rounded-xl bg-[#FAF6F0] p-3 text-sm text-gray-700">
            {t("transfer", { amount: baht(page.amount) })}
          </p>
        ))}

      <div className="space-y-3 border-t border-[#8C5A3C]/10 pt-4">
        <label className="block text-sm font-semibold">
          {awaitingReview ? t("attachNew") : t("attach")}
          <input
            type="file"
            accept={SLIP_TYPES.join(",")}
            className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#8C5A3C]/10 file:px-3 file:py-2 file:font-semibold file:text-[#8C5A3C]"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            disabled={uploadMutation.isPending}
          />
        </label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={t("previewAlt")} className="mx-auto max-h-64 rounded-xl border border-gray-200 object-contain" />
        )}
        <button
          type="button"
          className={`${shopButtonPrimary} w-full`}
          disabled={!file || uploadMutation.isPending || expiredNow}
          onClick={() => file && uploadMutation.mutate(file)}
        >
          {uploadMutation.isPending ? t("sending") : t("send")}
        </button>
        <p className="text-center text-xs text-gray-500">{t("accepted")}</p>
      </div>
    </div>
  );
}
