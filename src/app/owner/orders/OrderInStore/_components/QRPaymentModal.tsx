"use client";
// QR ชำระเงิน (mock) — สร้าง QR จาก payload ปลอมด้วย lib `qrcode` ไม่มี charge จริง/ไม่โพลสถานะ
// ปุ่ม "ลูกค้าชำระเงินแล้ว" = ยิง POST /orders ต่อ (พนักงานเป็นคนยืนยันว่าเห็นเงินเข้าแล้ว)
import { useEffect, useState } from "react";
import { Modal, Image } from "antd";
import QRCode from "qrcode";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/base";
import { formatCurrency } from "@/i18n/format";

export function QRPaymentModal({
  open,
  amount,
  submitting,
  onClose,
  onConfirmPaid,
}: {
  open: boolean;
  amount: number;
  submitting: boolean;
  onClose: () => void;
  onConfirmPaid: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    QRCode.toDataURL(`MEOWMEE-POS|amount=${amount}|ts=${Date.now()}`, { width: 240, margin: 1 })
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
    <Modal open={open} title={t("pos.qrTitle")} onCancel={onClose} footer={null} destroyOnHidden>
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="text-sm text-gray-600">{t("pos.qrHint")}</p>
        {dataUrl ? (
          <Image
            src={dataUrl}
            alt={t("pos.qrTitle")}
            width={240}
            height={240}
            preview={false}
            className="rounded-lg border border-gray-200"
          />
        ) : (
          <div className="h-[240px] w-[240px] animate-pulse rounded-lg bg-gray-100" />
        )}
        <p className="text-lg font-bold text-brown-800">{formatCurrency(amount, locale)}</p>
        <Button type="primary" block loading={submitting} onClick={onConfirmPaid}>
          {t("pos.qrConfirmPaid")}
        </Button>
      </div>
    </Modal>
  );
}
