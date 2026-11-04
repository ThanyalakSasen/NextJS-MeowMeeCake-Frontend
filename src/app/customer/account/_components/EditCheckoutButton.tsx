"use client";
// ─────────────────────────────────────────────────────────────
// ปุ่ม "แก้ไขวิธีรับสินค้า / ที่อยู่จัดส่ง" — ใช้ทั้งหน้าคำสั่งซื้อ · พรีออเดอร์ · ชำระรวมหลายบิล
// ทำงานจริงที่ useEditCheckout (ยกเลิกบิล → ใส่สินค้ากลับตะกร้า → กลับหน้ายืนยันคำสั่งซื้อ)
// ผู้เรียกแสดงปุ่มเฉพาะตอนแก้ได้ (canEditBill)
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { FaPen } from "react-icons/fa";
import { useEditCheckout, type EditBill } from "../../hooks/useEditCheckout";

export default function EditCheckoutButton({ bill, groupId }: { bill?: EditBill; groupId?: string | null }) {
  const t = useTranslations("shop.flow");
  const { edit, busy } = useEditCheckout();
  // สั่งพร้อมบิลอื่น = ยกเลิกทุกบิลในกลุ่ม → ข้อความบอกว่าทุกบิล
  const message = groupId
    ? t("editGroupConfirm")
    : bill?.kind === "preorder"
      ? t("editPreorderConfirm")
      : t("editCheckoutConfirm");
  return (
    <button
      type="button"
      onClick={() => void edit({ bill, groupId, message })}
      disabled={busy}
      className="inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-xl border border-[#8C5A3C]/30 bg-white px-3 text-xs font-bold text-[#4A342E] transition hover:bg-[#4A342E] hover:text-white disabled:opacity-50"
    >
      <FaPen className="text-xs" aria-hidden="true" />
      {busy ? t("editCheckoutBusy") : t("editCheckout")}
    </button>
  );
}
