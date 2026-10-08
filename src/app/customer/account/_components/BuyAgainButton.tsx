"use client";
// ปุ่ม "ซื้ออีกครั้ง" (BACKLOG4 U7) — ใส่ทุกรายการของออเดอร์ลงตะกร้าตามตัวเลือกเดิมแล้วไปหน้าตะกร้า (hooks/useBuyAgain)
import type { ShopOrderItem } from "@/services/shopOrders";
import { useBuyAgain } from "../../hooks/useBuyAgain";

export default function BuyAgainButton({ items, className }: { items: ShopOrderItem[]; className: string }) {
  const { buyAgain, pending } = useBuyAgain();
  if (!items.length) return null;
  return (
    <button type="button" className={className} disabled={pending} onClick={() => void buyAgain(items)}>
      {pending ? "กำลังใส่ตะกร้า..." : "ซื้ออีกครั้ง"}
    </button>
  );
}
