"use client";
// ชำระเงินสำเร็จ — สรุปจากยอดจริงของ backend (order.total_amount / discount_amount) + เงินทอน · เริ่มบิลใหม่
// (ยังไม่มีพิมพ์ใบเสร็จ — ระบบยังไม่มีใบเสร็จหน้าร้าน)
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/i18n/format";
import type { PaymentDone } from "../usePOSViewModel";

export function PaymentDoneModal({
  open,
  done,
  onNewBill,
}: {
  open: boolean;
  done: PaymentDone | null;
  onNewBill: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  if (!done) return null;

  const rows: [string, string, string?][] = [
    [t("pos.orderNo"), done.orderNo],
    [t("pos.payMethod"), done.method === "cash" ? t("pos.cash") : t("pos.qr")],
    [t("pos.payable"), formatCurrency(done.total, locale)],
    [t("pos.cashReceived"), formatCurrency(done.received, locale)],
    [t("pos.promoDiscount"), done.discount > 0 ? `−${formatCurrency(done.discount, locale)}` : formatCurrency(0, locale), "text-success"],
  ];

  return (
    <Modal open={open} onCancel={onNewBill} footer={null} closable={false} width={460} destroyOnHidden>
      <div role="dialog" aria-label={t("pos.doneTitle")} className="flex flex-col gap-3.5 text-center">
        <h2 className="m-0 text-2xl font-semibold text-success">{t("pos.doneTitle")}</h2>
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-gray-100 px-4 py-3.5 text-left">
          {rows.map(([label, value, cls]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-600">{label}</span>
              <span className={`font-medium tabular-nums ${cls ?? ""}`}>{value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-[14px] border-2 border-success px-4 py-3.5">
          <span className="font-semibold">{t("pos.cashChange")}</span>
          <span className="text-4xl font-semibold text-success tabular-nums">{formatCurrency(done.change, locale)}</span>
        </div>
        <button
          type="button"
          autoFocus
          onClick={onNewBill}
          className="min-h-[52px] cursor-pointer rounded-[14px] border-none bg-brown-800 font-semibold text-white"
        >
          {t("pos.newBill")}
        </button>
      </div>
    </Modal>
  );
}
