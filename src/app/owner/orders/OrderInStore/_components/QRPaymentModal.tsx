"use client";
// QR ชำระเงิน (mock) — สร้าง QR จาก payload ปลอมด้วย lib `qrcode` ไม่มี charge จริง/ไม่โพลสถานะ
// ปุ่ม "ได้รับเงินแล้ว" = สร้างออเดอร์ต่อ (พนักงานเป็นคนยืนยันว่าเห็นเงินเข้าแล้ว) · เปลี่ยนเป็นเงินสดได้
import { useEffect, useState } from "react";
import { Modal, Image } from "antd";
import QRCode from "qrcode";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/i18n/format";

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
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    QRCode.toDataURL(`MEOWMEE-POS|amount=${amount}|ts=${Date.now()}`, { width: 230, margin: 1 })
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch(() => {
        if (alive) setDataUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [open, amount]);

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width={460} destroyOnHidden maskClosable={!submitting}>
      <div role="dialog" aria-label={t("pos.qrTitle")} className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[22px] font-semibold text-brown-900">{t("pos.qrTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-11 cursor-pointer rounded-xl border-none bg-gray-100 px-3.5 text-brown-900"
          >
            {t("common.close")}
          </button>
        </div>

        <div className="flex h-[230px] w-[230px] items-center justify-center self-center rounded-2xl border-2 border-dashed border-info bg-blue-50">
          {dataUrl ? (
            <Image src={dataUrl} alt={t("pos.qrTitle")} width={210} height={210} preview={false} />
          ) : (
            <div className="h-[210px] w-[210px] animate-pulse rounded-lg bg-blue-100" />
          )}
        </div>

        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-sm text-gray-600">{t("pos.qrAmountLabel")}</span>
          <span className="text-4xl font-semibold leading-tight text-brown-900 tabular-nums">{formatCurrency(amount, locale)}</span>
        </div>

        <div className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900">{t("pos.qrHint")}</div>

        <button
          type="button"
          onClick={onConfirmPaid}
          disabled={submitting}
          className="min-h-14 cursor-pointer rounded-[14px] border-none bg-info text-[17px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? t("pos.processing") : t("pos.qrConfirmPaid")}
        </button>
        <button
          type="button"
          onClick={onSwitchToCash}
          disabled={submitting}
          className="min-h-11 cursor-pointer rounded-xl border border-gray-300 bg-white text-brown-900"
        >
          {t("pos.qrSwitchToCash")}
        </button>
      </div>
    </Modal>
  );
}
