"use client";
// บิลที่พักไว้ในเครื่องนี้ — เวลาพัก · จำนวนชิ้น · ยอด · สมาชิก → เรียกกลับมาขายต่อ / ลบทิ้ง
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/base";
import { formatCurrency, formatDate } from "@/i18n/format";
import { heldBillItemCount, heldBillSubtotal, type HeldBill } from "../posHeldBills";

export function HeldBillsModal({
  open,
  bills,
  onResume,
  onDelete,
  onClose,
}: {
  open: boolean;
  bills: HeldBill[];
  onResume: (bill: HeldBill) => void;
  onDelete: (bill: HeldBill) => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Modal open={open} title={t("pos.heldTitle")} onCancel={onClose} footer={null} width={520} destroyOnHidden>
      {bills.length === 0 ? (
        <p className="m-0 py-6 text-center text-gray-500">{t("pos.heldEmpty")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {bills.map((b) => (
            <li key={b.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5">
              <div className="flex min-w-0 flex-1 flex-col leading-snug">
                <span className="font-medium text-brown-900">
                  {t("pos.heldSummary", { n: heldBillItemCount(b), amount: formatCurrency(heldBillSubtotal(b), locale) })}
                </span>
                <span className="truncate text-xs text-gray-600">
                  {b.cart.map((c) => `${c.name} ×${c.qty}`).join(", ")}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(b.heldAt, locale, { withTime: true })}
                  {b.member && ` · ${b.member.user_fullname}`}
                </span>
              </div>
              <Button type="primary" onClick={() => onResume(b)}>
                {t("pos.resumeBill")}
              </Button>
              <Button danger onClick={() => onDelete(b)}>
                {t("pos.deleteHeld")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
