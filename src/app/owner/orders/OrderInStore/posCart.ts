// ─────────────────────────────────────────────────────────────
// posCart.ts — pure: ตะกร้าขายหน้าร้าน + แปลงเป็น body ของ POST /admin/orders
// ขอบเขต #8: สินค้าเดี่ยวเท่านั้น — bundle/promotion เป็นของนอก 27 screen (เฟสหลัง)
// ─────────────────────────────────────────────────────────────
import type { Product } from "@/types/product";
import type { OrderInput } from "@/types/order";

export interface CartLine {
  productId: string;
  name: string;
  /** ราคาต่อหน่วยที่ใช้ขาย (sale_price ถ้ามี ไม่งั้น product_price) */
  price: number;
  qty: number;
  /** สต็อกคงเหลือ ณ ตอนหยิบ — จำกัด qty สูงสุด */
  stock: number;
}

const priceOf = (p: Product) => p.sale_price ?? p.product_price;

export function addLine(cart: CartLine[], p: Product): CartLine[] {
  const stock = p.product_stock_quantity ?? 0;
  const existing = cart.find((c) => c.productId === p._id);
  if (existing) {
    return cart.map((c) =>
      c.productId === p._id ? { ...c, qty: Math.min(c.qty + 1, c.stock) } : c,
    );
  }
  return [...cart, { productId: p._id, name: p.product_name_th, price: priceOf(p), qty: 1, stock }];
}

export function setLineQty(cart: CartLine[], productId: string, qty: number): CartLine[] {
  return cart.map((c) =>
    c.productId === productId ? { ...c, qty: Math.max(1, Math.min(qty, c.stock)) } : c,
  );
}

export function removeLine(cart: CartLine[], productId: string): CartLine[] {
  return cart.filter((c) => c.productId !== productId);
}

export function cartSubtotal(cart: CartLine[]): number {
  return cart.reduce((s, c) => s + c.price * c.qty, 0);
}

/**
 * cart + ลูกค้า → body ของ POST /admin/orders จริง (backend gen order_no/subtotal/total_amount
 * เอง — รับแค่ user_id + items เป็น product_id/quantity) ขายหน้าร้าน = "takeaway" เสมอ
 * (ไม่มีที่อยู่จัดส่ง) ส่วนการทำเครื่องหมายจ่ายเงินแล้ว+เสร็จสิ้น ทำหลังสร้างออเดอร์สำเร็จ
 * (ดู usePOSViewModel.ts — สร้าง payment + verify + เปลี่ยนสถานะแยกเป็นขั้นตอนถัดไป)
 */
export function buildOrderInput(args: {
  cart: CartLine[];
  guestUserId: string;
  discount: number;
}): OrderInput {
  return {
    user_id: args.guestUserId,
    source: "items",
    order_type: "takeaway",
    channel: "instore",
    items: args.cart.map((c) => ({ product_id: c.productId, quantity: c.qty })),
    discount_amount: args.discount || undefined,
  };
}
