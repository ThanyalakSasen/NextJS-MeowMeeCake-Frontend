"use client";
// ปุ่ม "ได้รับสินค้าแล้ว" — ออเดอร์/พรีออเดอร์แบบจัดส่งที่ร้านจัดส่งแล้ว (delivery_status = shipping)
// ร้านอัปเดตได้ถึง "กำลังจัดส่ง" · ลูกค้ากดปุ่มนี้ = ส่งถึง + สำเร็จ (ได้แต้มสะสม · รีวิวได้) — POST /shop/{orders|preorders}/{id}/received
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { shopOrdersService } from "@/services/shopOrders";
import { shopPreordersService } from "@/services/shopPreorders";
import { shopButtonPrimary } from "@/components/customer/shopStyles";
import { shopOrdersAllKey, shopPointsKey, shopPreordersAllKey } from "../../lib/shopQueries";

/** แสดงปุ่มเมื่อ: จัดส่ง + ร้านจัดส่งแล้ว + ยังไม่จบ */
export function canConfirmReceived(o: { order_type: string; delivery_status?: string | null; order_status: string }): boolean {
  return o.order_type === "delivery" && o.delivery_status === "shipping" && o.order_status !== "completed" && o.order_status !== "cancelled";
}

export default function ConfirmReceivedButton({ kind, id }: { kind: "order" | "preorder"; id: string }) {
  const t = useTranslations("shop.orders");
  const qc = useQueryClient();
  const confirm = useMutation({
    mutationFn: () => (kind === "order" ? shopOrdersService.confirmReceived(id) : shopPreordersService.confirmReceived(id)),
    onSuccess: () => {
      alert.success(t("receivedDone"));
      void qc.invalidateQueries({ queryKey: kind === "order" ? shopOrdersAllKey : shopPreordersAllKey });
      void qc.invalidateQueries({ queryKey: shopPointsKey }); // สำเร็จ = ได้แต้ม
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("receivedFailed")),
  });
  const onClick = async () => {
    const ok = await confirmAlert(t("receivedConfirm"), { title: t("receivedTitle"), confirmText: t("received"), cancelText: t("receivedNotYet") });
    if (ok) confirm.mutate();
  };
  return (
    <button type="button" className={shopButtonPrimary} onClick={() => void onClick()} disabled={confirm.isPending}>
      {confirm.isPending ? t("receivedSaving") : t("received")}
    </button>
  );
}
