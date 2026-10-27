// ─────────────────────────────────────────────────────────────
// deliveryClose.ts — pure: งานจัดส่งที่ "ลูกค้า" เป็นคนปิด (ตรงกับ backend lib/orderLifecycle customerClosesDelivery)
// ออเดอร์เว็บ (ORD-) + พรีออเดอร์ แบบจัดส่ง: ร้านอัปเดตได้ถึง "กำลังจัดส่ง" · ลูกค้ากด "ได้รับสินค้าแล้ว" = ส่งถึง + สำเร็จ
// ออเดอร์หน้าร้าน (POS-) ไม่มีลูกค้าในเว็บที่จะกด — ร้านปิดงานเองเหมือนเดิม
// ─────────────────────────────────────────────────────────────
import type { OrderType } from "@/types/order";

export function customerClosesDelivery(o: { order_type: OrderType; order_no?: string; preorder_no?: string }): boolean {
  if (o.order_type !== "delivery") return false;
  return !!o.preorder_no || (o.order_no ?? "").startsWith("ORD-");
}
