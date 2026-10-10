"use client";
// ─────────────────────────────────────────────────────────────
// ส่วน "รอโอนคืน" ใน drawer ออเดอร์/พรีออเดอร์ — ยกเลิกแล้วแต่ยังชำระแล้ว (isAwaitingRefund)
// ลูกค้ายกเลิกออเดอร์ที่ชำระแล้วเอง → backend ไม่คืนเงินอัตโนมัติ (customer-backend-merge.md §8.8)
// ร้านโอนเงินคืนนอกระบบ แล้วกดยืนยันที่นี่ → POST /admin/payments/:id/refund (paid → refunded) · สิทธิ์ payments.approve
// บัญชีพร้อมเพย์ที่ลูกค้าตั้งไว้ (refund_account จาก GET รายละเอียด · Q-BE12) แสดงให้โอนได้เลย · ไม่มี = ให้ติดต่อลูกค้า
// presentational ล้วน — ViewModel ส่ง payment ที่ชำระแล้ว + handler มา
// ─────────────────────────────────────────────────────────────
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/base";
import { actionIcon } from "@/components/shared/actions";
import { formatCurrency } from "@/i18n/format";
import { formatPromptpayId } from "@/lib/promptpay";
import type { RefundAccount } from "@/types/order";

export function RefundSection({
  amount,
  reason,
  account,
  paidPaymentId,
  canRefund,
  refunding,
  onRefund,
}: {
  amount: number;
  reason: string | null | undefined;
  /** บัญชีพร้อมเพย์รับเงินคืนของลูกค้า · null = ลูกค้ายังไม่ได้ตั้ง */
  account: RefundAccount | null;
  /** รายการชำระเงินที่สถานะ paid (ตัวที่จะคืน) · null = หาไม่เจอ */
  paidPaymentId: string | null;
  canRefund: boolean;
  refunding: boolean;
  onRefund: (paymentId: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const money = formatCurrency(amount, locale);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
      <p className="font-semibold text-warning">{t("orders.awaitingRefundTitle")}</p>
      <p className="text-gray-700">{t("orders.awaitingRefundDetail", { amount: money })}</p>
      {reason && <p className="text-gray-600">{t("orders.cancelReasonLabel", { reason })}</p>}
      {account ? (
        <div className="rounded-md bg-white/70 px-2.5 py-2">
          <p className="font-semibold text-gray-800">{t("orders.refundAccount", { id: formatPromptpayId(account.promptpay_id) })}</p>
          {account.promptpay_name && <p className="text-gray-700">{t("orders.refundAccountName", { name: account.promptpay_name })}</p>}
        </div>
      ) : (
        <p className="text-gray-600">{t("orders.refundAccountMissing")}</p>
      )}
      {!paidPaymentId ? (
        <p className="text-gray-600">{t("orders.noPaidPayment")}</p>
      ) : canRefund ? (
        <Button
          size="small"
          type="primary"
          className="w-fit"
          icon={actionIcon("verify", "small")}
          loading={refunding}
          onClick={() => onRefund(paidPaymentId)}
        >
          {t("orders.confirmRefund")}
        </Button>
      ) : (
        <p className="text-gray-600">{t("orders.refundNoPermission")}</p>
      )}
    </div>
  );
}
