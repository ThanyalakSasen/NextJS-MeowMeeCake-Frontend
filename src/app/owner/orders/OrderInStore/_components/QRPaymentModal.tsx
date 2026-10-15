"use client";
// QR พร้อมเพย์จริงของร้าน — ยอด = ยอดบิล · เลขพร้อมเพย์ + ชื่อบัญชีจากหน้า "ข้อมูลร้านค้า" (GET /admin/pos/promptpay-qr)
// ไม่มีการยืนยันเงินเข้าอัตโนมัติ (ไม่ใช้ payment gateway) — พนักงานตรวจยอดในแอปธนาคารแล้วกด "ได้รับเงินแล้ว" = สร้างออเดอร์ต่อ
// สร้าง QR ไม่ได้ (เช่น ร้านยังไม่ตั้งเลขพร้อมเพย์ — 422) → แจ้งเหตุผล + ปุ่มลองใหม่ · ปุ่มยืนยันปิดไว้ · เปลี่ยนเป็นเงินสดได้
import { Modal, Image } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/i18n/format";
import { formatPromptpayId } from "@/lib/promptpay";
import { posService } from "@/services/pos";
import { isApiError } from "@/types/api";

export function QRPaymentModal({
  open,
  amount,
  submitting,
  onClose,
  onConfirmPaid,
  onSwitchToCash,
}: {
  open: boolean;
  amount: number;
  submitting: boolean;
  onClose: () => void;
  onConfirmPaid: () => void;
  onSwitchToCash: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  // ยอดใน QR ต้องเป็นบาทไม่เกิน 2 ตำแหน่ง (backend ตรวจซ้ำ)
  const qrAmount = Math.round(amount * 100) / 100;
  const qrQ = useQuery({
    queryKey: ["pos", "promptpay-qr", qrAmount],
    queryFn: () => posService.promptpayQr(qrAmount),
    enabled: open && qrAmount > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const qr = qrQ.data;

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width={460} destroyOnHidden maskClosable={!submitting}>
      <div role="dialog" aria-label={t("pos.qrTitle")} className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[22px] font-semibold text-brown-900">{t("pos.qrTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-[36px] cursor-pointer rounded-lg border-none bg-gray-100 px-4 font-medium text-brown-900"
          >
            {t("common.close")}
          </button>
        </div>

        <div className="flex h-[260px] w-[260px] items-center justify-center self-center rounded-2xl border border-gray-200 bg-white">
          {qr ? (
            <Image src={qr.qr_image} alt={t("pos.qrTitle")} width={244} height={244} preview={false} />
          ) : qrQ.isError ? (
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <p className="m-0 text-sm text-danger">
                {isApiError(qrQ.error) ? qrQ.error.message : t("pos.qrLoadFailed")}
              </p>
              <p className="m-0 text-xs text-gray-500">{t("pos.qrSetupHint")}</p>
              <button
                type="button"
                onClick={() => void qrQ.refetch()}
                className="h-[32px] cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-brown-900"
              >
                {t("common.retry")}
              </button>
            </div>
          ) : (
            <div className="h-[244px] w-[244px] animate-pulse rounded-lg bg-gray-100" aria-label={t("common.loading")} />
          )}
        </div>

        {qr && (
          <div className="flex flex-col items-center gap-0.5 text-center text-sm text-gray-600">
            {qr.account_name && (
              <span>
                {t("pos.qrAccountName")} <span className="font-semibold text-brown-900">{qr.account_name}</span>
              </span>
            )}
            <span>
              {t("pos.qrPromptpayId")} <span className="font-medium tabular-nums text-brown-900">{formatPromptpayId(qr.promptpay_id)}</span>
            </span>
          </div>
        )}

        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-sm text-gray-600">{t("pos.qrAmountLabel")}</span>
          <span className="text-4xl font-semibold leading-tight text-brown-900 tabular-nums">{formatCurrency(qrAmount, locale)}</span>
        </div>

        <div className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900">{t("pos.qrHint")}</div>

        <button
          type="button"
          onClick={onConfirmPaid}
          disabled={submitting || !qr}
          className="h-[36px] cursor-pointer rounded-lg border-none bg-info font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? t("pos.processing") : t("pos.qrConfirmPaid")}
        </button>
        <button
          type="button"
          onClick={onSwitchToCash}
          disabled={submitting}
          className="h-[36px] cursor-pointer rounded-lg border border-gray-300 bg-white font-medium text-brown-900"
        >
          {t("pos.qrSwitchToCash")}
        </button>
      </div>
    </Modal>
  );
}
