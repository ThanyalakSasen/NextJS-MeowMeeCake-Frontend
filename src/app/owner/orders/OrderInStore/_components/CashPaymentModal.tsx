"use client";
// รับเงินสด — ยอดชำระ · รับเงินมา (คีย์แพด / ปุ่มด่วน / คีย์บอร์ดตัวเลข) · เงินทอนหรือยอดที่ยังขาด
// คีย์บอร์ด (ตัวเลข/Backspace/Enter) จัดการที่ usePOSViewModel — หน้าต่างนี้ไม่มี input ให้ focus
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/i18n/format";

/** ธนบัตรที่เสนอเป็นปุ่มด่วน (เลือก 3 ใบแรกที่มากกว่ายอดชำระ) */
const BILLS = [100, 500, 1000, 2000];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"];

export function CashPaymentModal({
  open,
  total,
  received,
  short,
  submitting,
  onPressKey,
  onPick,
  onConfirm,
  onClose,
}: {
  open: boolean;
  total: number;
  received: number;
  short: boolean;
  submitting: boolean;
  onPressKey: (k: string) => void;
  onPick: (amount: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const quick = [
    { label: t("pos.cashExact"), value: total },
    ...BILLS.filter((b) => b > total).slice(0, 3).map((b) => ({ label: formatCurrency(b, locale), value: b })),
  ];

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width={460} destroyOnHidden mask={{ closable: !submitting }}>
      <div role="dialog" aria-label={t("pos.cashTitle")} className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[22px] font-semibold text-brown-900">{t("pos.cashTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-[36px] cursor-pointer rounded-lg border-none bg-gray-100 px-4 font-medium text-brown-900"
          >
            {t("common.close")}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[14px] bg-gray-100 px-3.5 py-3">
            <div className="text-sm text-gray-600">{t("pos.payable")}</div>
            <div className="text-[26px] font-semibold tabular-nums">{formatCurrency(total, locale)}</div>
          </div>
          <div className="rounded-[14px] border-2 border-brown-900 px-3.5 py-3">
            <div className="text-sm text-gray-600">{t("pos.cashReceived")}</div>
            <div className="text-[26px] font-semibold tabular-nums">{formatCurrency(received, locale)}</div>
          </div>
        </div>

        <div
          className={`flex items-center justify-between rounded-[14px] px-4 py-3 ${
            // ขาด = แดง · ต้องทอน = เทา · พอดี = เขียว
            short ? "bg-red-50 text-danger" : received > total ? "bg-gray-100 text-brown-900" : "bg-green-50 text-success"
          }`}
        >
          <span className="font-semibold">{short ? t("pos.cashShort") : t("pos.cashChange")}</span>
          <span className="text-[30px] font-semibold tabular-nums">{formatCurrency(Math.abs(received - total), locale)}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => onPick(q.value)}
              className="h-[36px] cursor-pointer rounded-lg border border-success bg-green-50 font-medium text-success"
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onPressKey(k)}
              aria-label={k === "back" ? t("pos.keyBackspace") : k}
              className="h-[36px] cursor-pointer rounded-lg border border-gray-200 bg-white text-base font-medium text-brown-900"
            >
              {k === "back" ? t("pos.keyBackspace") : k}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onConfirm}
          disabled={short || submitting}
          className="h-[36px] cursor-pointer rounded-lg border-none bg-success font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? t("pos.processing") : t("pos.cashConfirm")}
        </button>
      </div>
    </Modal>
  );
}
