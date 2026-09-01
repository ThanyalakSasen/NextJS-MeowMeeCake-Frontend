// ─────────────────────────────────────────────────────────────
// posCart.ts — pure: ตะกร้าขายหน้าร้าน + แปลงเป็น body ของ POST /orders
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

/** cart + ข้อมูลชำระเงิน → body ของ POST /orders — ขายหน้าร้าน = จบทันที (completed + paid) */
export function buildOrderInput(args: {
  cart: CartLine[];
  /** ชื่อลูกค้า (ผู้เรียก resolve ค่า default มาแล้ว — ห้ามใส่ literal ไทยที่นี่) */
  customerName: string;
  total: number;
  orderNo: string;
  /** ISO ปัจจุบัน */
  now: string;
}): OrderInput {
  return {
    order_no: args.orderNo,
    order_type: "ready",
    customer_name: args.customerName,
    customer_phone: "-",
    items: args.cart.map((c) => ({ product_name: c.name, quantity: c.qty })),
    total_amount: args.total,
    order_status: "completed",
    payment_status: "paid",
    payment_slip_url: null,
    payment_verified_at: args.now,
    due_date: args.now,
  };
}
