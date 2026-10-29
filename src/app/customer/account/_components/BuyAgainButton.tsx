"use client";
// ปุ่ม "ซื้ออีกครั้ง" (BACKLOG4 U7) — ใส่ทุกรายการของออเดอร์ลงตะกร้าตามตัวเลือกเดิมแล้วไปหน้าตะกร้า (hooks/useBuyAgain)
import { useTranslations } from "next-intl";
import type { ShopOrderItem } from "@/services/shopOrders";
import { useBuyAgain } from "../../hooks/useBuyAgain";
import { canReview, useReviewedItems } from "../../hooks/useReviewedItems";

export default function BuyAgainButton({ items, className }: { items: ShopOrderItem[]; className: string }) {
  const t = useTranslations("shop.orders");
  const { buyAgain, pending } = useBuyAgain();
  if (!items.length) return null;
  return (
    <button type="button" className={className} disabled={pending} onClick={() => void buyAgain(items)}>
      {pending ? t("addingToCart") : t("buyAgain")}
    </button>
  );
}

/**
 * "ซื้ออีกครั้ง" ตามสถานะออเดอร์ (2026-10-28):
 *   ยกเลิกแล้ว = แสดง · สำเร็จแล้ว = แสดงเมื่อรีวิวครบทุกรายการเท่านั้น (ยังไม่รีวิว = ให้ปุ่มรีวิวเด่นกว่า) · อื่น ๆ = fallback
 */
export function BuyAgainAfterReview({
  order,
  items,
  className,
  fallback = null,
}: {
  order: { order_status: string; payment_status: string };
  items: ShopOrderItem[];
  className: string;
  fallback?: React.ReactNode;
}) {
  const completed = order.order_status === "completed";
  const { reviewed, loaded } = useReviewedItems("order", completed && canReview(order));
  const allReviewed = completed && canReview(order) && loaded && items.length > 0 && items.every((it) => reviewed.has(it._id));
  if (order.order_status === "cancelled" || allReviewed) return <BuyAgainButton items={items} className={className} />;
  return <>{fallback}</>;
}
