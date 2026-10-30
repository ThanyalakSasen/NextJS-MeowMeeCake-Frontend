"use client";
// ─────────────────────────────────────────────────────────────
// "กลับไปแก้ไขที่อยู่ / วิธีรับ" — หน้าชำระเงินหลังเพิ่งสั่ง (ยังไม่ชำระ · ยังไม่ส่งสลิป)
// คำสั่งซื้อถูกสร้างไปแล้วตอนกดสั่ง → แก้ = ยกเลิกคำสั่งซื้อนี้ (backend คืนสต็อก + คืนสิทธิ์คูปอง/โปรให้เอง)
//   แล้วใส่สินค้าเดิมกลับลงตะกร้า (ตัวเลือก/ออปชันเดิม · useBuyAgain) → กลับหน้ายืนยันคำสั่งซื้อให้เลือกที่อยู่/วิธีรับใหม่
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FaPen } from "react-icons/fa";
import { shopOrdersService, type ShopOrderItem } from "@/services/shopOrders";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { shopButton } from "@/components/customer/shopStyles";
import { useBuyAgain } from "../../hooks/useBuyAgain";
import { shopOrderKey, shopOrdersKey } from "../../lib/shopQueries";

export default function EditCheckoutButton({
  orderId,
  items,
  compact = false,
}: {
  orderId: string;
  items: ShopOrderItem[];
  /** ปุ่มเล็กชิดขวาในแถวที่อยู่จัดส่ง */
  compact?: boolean;
}) {
  const t = useTranslations("shop.flow");
  const qc = useQueryClient();
  const { buyAgain, pending } = useBuyAgain();
  const [cancelling, setCancelling] = useState(false);

  const onClick = async () => {
    const ok = await confirmAlert(t("editCheckoutConfirm"), {
      title: t("editCheckout"),
      confirmText: t("editCheckoutGo"),
      cancelText: t("editCheckoutStay"),
    });
    if (!ok) return;
    setCancelling(true);
    try {
      await shopOrdersService.cancel(orderId, t("editCheckoutReason"));
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("editCheckoutFailed"));
      setCancelling(false);
      return;
    }
    void qc.invalidateQueries({ queryKey: shopOrderKey(orderId) });
    void qc.invalidateQueries({ queryKey: shopOrdersKey });
    await buyAgain(items, { redirect: "/customer/checkout", quiet: true });
    setCancelling(false);
  };

  const busy = cancelling || pending;
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      className={
        compact
          ? "inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-xl border border-[#8C5A3C]/30 bg-white px-3 text-xs font-bold text-[#4A342E] transition hover:bg-[#4A342E] hover:text-white disabled:opacity-50"
          : `${shopButton} inline-flex items-center gap-2 disabled:opacity-50`
      }
    >
      <FaPen className="text-xs" aria-hidden="true" />
      {busy ? t("editCheckoutBusy") : t("editCheckout")}
    </button>
  );
}
