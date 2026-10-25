"use client";
// ชำระเงินสำเร็จ — สรุปจากยอดจริงของ backend (order.total_amount / discount_amount) + เงินทอน · พิมพ์ใบเสร็จ · เริ่มบิลใหม่
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "@/i18n/format";
import type { StoreInfo } from "@/services/storeInfo";
import type { PaymentDone } from "../usePOSViewModel";
import { PosReceipt } from "./PosReceipt";

export function PaymentDoneModal({
  open,
  done,
  store,
  onNewBill,
}: {
  open: boolean;
  done: PaymentDone | null;
  /** หัวใบเสร็จ — null = พิมพ์ได้แต่ไม่มีชื่อ/ที่อยู่ร้าน */
  store: StoreInfo | null;
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
    ...(done.member
      ? ([
          [t("pos.memberLabel"), done.member.name],
          [t("pos.memberPointsEarned"), t("pos.memberPointsValue", { n: done.member.points }), "text-success"],
        ] as [string, string, string?][])
      : []),
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
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-brown-800 bg-white font-medium text-brown-800"
          >
            <PrinterIcon className="h-4 w-4" />
            {t("pos.printReceipt")}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onNewBill}
            className="h-[36px] cursor-pointer rounded-lg border-none bg-brown-800 font-medium text-white"
          >
            {t("pos.newBill")}
          </button>
        </div>
      </div>
      {open && <PosReceipt done={done} store={store} />}
    </Modal>
  );
}
