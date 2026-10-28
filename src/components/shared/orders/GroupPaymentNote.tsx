"use client";
// ─────────────────────────────────────────────────────────────
// ป้าย "สลิปชำระรวมหลายบิล" ใต้หัวข้อหลักฐานการชำระเงิน (หลังร้าน — ออเดอร์/พรีออเดอร์)
// ลูกค้าสั่งซื้อรวม (ตะกร้ารวม 2026-10-27) แล้วโอนครั้งเดียว — ยอดในสลิป = ยอดรวมทุกบิล ไม่ใช่ยอดบิลนี้
// ยืนยัน/ปฏิเสธที่บิลใดบิลหนึ่ง = ทุกบิลในกลุ่ม (backend paymentService.verifyPayment)
// ─────────────────────────────────────────────────────────────
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/i18n/format";
import type { Payment } from "@/types/payment";

export function GroupPaymentNote({ payment }: { payment: Payment | null | undefined }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const group = payment?.group;
  if (!group || group.bill_count < 2) return null;
  return (
    <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
      {t("groupPaymentNote", {
        n: group.bill_count,
        docs: group.doc_nos.join(", "),
        amount: formatCurrency(group.total_amount, locale),
      })}
    </p>
  );
}
