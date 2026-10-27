"use client";
// ใช้ร่วมกันหน้าชำระรวม (page.tsx) และหน้าสั่งซื้อสำเร็จของชำระรวม (success/page.tsx)
// — page.tsx ของ Next export ได้แค่ default จึงแยกออกมาไว้ที่นี่
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { shopCheckoutService, type GroupBill } from "@/services/shopCheckout";
import { isApiError } from "@/types/api";
import { paymentGroupKey } from "../../../lib/shopQueries";

export const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

/** GET /shop/payment-groups/{id} — fetchedAt ใช้ชดเชยนาฬิกาเครื่องตอนนับถอยหลัง */
export function usePaymentGroup(id: string, valid: boolean) {
  const [fetchedAt, setFetchedAt] = useState(0);
  const q = useQuery({
    queryKey: paymentGroupKey(id),
    queryFn: async () => {
      const page = await shopCheckoutService.paymentGroup(id);
      setFetchedAt(Date.now());
      return page;
    },
    enabled: valid,
    retry: (n, e) => !(isApiError(e) && e.status === 404) && n < 2,
    // รอร้านตรวจ = ดึงใหม่เป็นระยะ ให้เห็นตอนร้านยืนยันแล้ว
    refetchInterval: (query) => (query.state.data?.status === "awaiting_review" ? 30_000 : false),
  });
  return { q, fetchedAt };
}

/** ป้ายสถานะบิล — ยกเลิก / ชำระแล้ว / รอตรวจสลิป / รอชำระ */
export function BillStatus({ b }: { b: GroupBill }) {
  const t = useTranslations("shop.paymentGroup");
  const tps = useTranslations("shop.paymentStatus");
  const tos = useTranslations("shop.orderStatus");
  const [text, tone] =
    b.order_status === "cancelled"
      ? [tos("cancelled"), "bg-stone-100 text-stone-500"]
      : b.payment_status === "paid"
        ? [tps("paid"), "bg-emerald-50 text-emerald-700"]
        : b.payment_record_status === "pending" && b.slip_url
          ? [t("reviewing"), "bg-amber-50 text-amber-700"]
          : [tps(b.payment_status), "bg-sky-50 text-sky-700"];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{text}</span>;
}
