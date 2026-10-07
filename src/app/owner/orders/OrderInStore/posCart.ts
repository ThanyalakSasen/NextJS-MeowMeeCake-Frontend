// ─────────────────────────────────────────────────────────────
// posCart.ts — pure: ตะกร้าขายหน้าร้าน + แปลงเป็น body ของ POST /admin/orders
// สินค้าที่มีกลุ่มตัวเลือก/ออปชัน: 1 บรรทัด = สินค้า + ชุดตัวเลือก (lineKey) · ราคา/ชิ้น = ราคาขาย + ราคาบวกเพิ่ม
// สต็อกอยู่ที่ตัวสินค้า (ไม่มีสต็อกต่อตัวเลือก) → จำนวนรวมทุกบรรทัดของสินค้าเดียวกันห้ามเกินสต็อก (BACKLOG3-merge I4)
// ─────────────────────────────────────────────────────────────
import type { Product } from "@/types/product";
import type { OrderInput } from "@/types/order";
import { refId } from "@/lib/refId";
import type { PromoLine } from "./posPromotion";
import { EMPTY_SELECTION, type CartSelection, type SelectedOptionLine } from "@/lib/customizationSelection";

export interface CartLine {
  /** สินค้า + ชุดตัวเลือก — ใช้แยก/อ้างบรรทัด (สินค้าไม่มีตัวเลือก = productId) */
  lineKey: string;
  productId: string;
  /** รหัสสินค้า/บาร์โค้ด เช่น "pos-0126264" — ไม่ใช่ทุกสินค้าจะมี */
  code: string | null;
  /** ใช้เช็คโปรโมชันที่จำกัดตามหมวด */
  categoryId: string | null;
  name: string;
  /** ราคาต่อหน่วยที่ใช้ขาย = (sale_price ถ้ามี ไม่งั้น product_price) + ราคาตัวเลือกที่บวกเพิ่ม — พรีวิว (backend คิดจริง) */
  price: number;
  qty: number;
  /** สต็อกคงเหลือของสินค้า ณ ตอนหยิบ — จำนวนรวมทุกบรรทัดของสินค้านี้ห้ามเกิน */
  stock: number;
  variantIds: string[];
  options: SelectedOptionLine[];
  /** ข้อความกลุ่มตัวเลือกที่เลือก เช่น "ขนาด: 2 ปอนด์" */
  variantLabel: string | null;
}

const priceOf = (p: Product) => p.sale_price ?? p.product_price;

/** จำนวนรวมของสินค้านี้ทุกบรรทัด (ทุกชุดตัวเลือก) */
export function productQty(cart: CartLine[], productId: string, exceptLineKey?: string): number {
  return cart.filter((c) => c.productId === productId && c.lineKey !== exceptLineKey).reduce((s, c) => s + c.qty, 0);
}

const lineKeyOf = (productId: string, sel: CartSelection) => (sel.key ? `${productId}#${sel.key}` : productId);

export function addLine(cart: CartLine[], p: Product, sel: CartSelection = EMPTY_SELECTION): CartLine[] {
  const stock = p.product_stock_quantity ?? 0;
  if (productQty(cart, p._id) >= stock) return cart;
  const lineKey = lineKeyOf(p._id, sel);
  if (cart.some((c) => c.lineKey === lineKey)) {
    return cart.map((c) => (c.lineKey === lineKey ? { ...c, qty: c.qty + 1 } : c));
  }
  return [
    ...cart,
    {
      lineKey,
      productId: p._id,
      code: p.product_id ?? null,
      categoryId: refId(p.category_id) || null,
      name: p.product_name_th,
      price: Math.round((priceOf(p) + sel.extra) * 100) / 100,
      qty: 1,
      stock,
      variantIds: sel.variantIds,
      options: sel.options,
      variantLabel: sel.variantLabel,
    },
  ];
}

/** สินค้านี้ในบิลรวมทุกบรรทัดเต็มสต็อกแล้ว (เพิ่มอีกไม่ได้) */
export function isAtStock(cart: CartLine[], productId: string): boolean {
  const line = cart.find((c) => c.productId === productId);
  return !!line && productQty(cart, productId) >= line.stock;
}

/** ตะกร้า → รายการสำหรับคิดโปรโมชัน (posPromotion.ts) */
export function toPromoLines(cart: CartLine[]): PromoLine[] {
  return cart.map((c) => ({ productId: c.productId, categoryId: c.categoryId, qty: c.qty, lineTotal: c.price * c.qty }));
}

export function setLineQty(cart: CartLine[], lineKey: string, qty: number): CartLine[] {
  return cart.map((c) => {
    if (c.lineKey !== lineKey) return c;
    const room = c.stock - productQty(cart, c.productId, lineKey);
    return { ...c, qty: Math.max(1, Math.min(qty, room)) };
  });
}

export function removeLine(cart: CartLine[], lineKey: string): CartLine[] {
  return cart.filter((c) => c.lineKey !== lineKey);
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
  /** เลือกโปรโมชัน → ส่ง promotion_id แทน discount_amount (backend คิดส่วนลดเอง · ใช้คู่กับส่วนลดกรอกมือไม่ได้) */
  promotionId?: string | null;
}): OrderInput {
  return {
    user_id: args.guestUserId,
    source: "items",
    order_type: "takeaway",
    channel: "instore",
    items: args.cart.map((c) => ({
      product_id: c.productId,
      quantity: c.qty,
      ...(c.variantIds.length ? { variant_ids: c.variantIds } : {}),
      ...(c.options.length
        ? { selected_options: c.options.map((o) => ({ option_id: o.option_id, ...(o.text_value ? { text_value: o.text_value } : {}) })) }
        : {}),
    })),
    ...(args.promotionId
      ? { promotion_id: args.promotionId }
      : { discount_amount: args.discount || undefined }),
  };
}
