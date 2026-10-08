// ─────────────────────────────────────────────────────────────
// รายการในตะกร้าที่ "ซื้อไม่ได้" (BACKLOG4 U6 · แทน cartItemBlocked ของ FrontOffice)
// /shop/cart ส่งแค่ is_visible / is_preorder ของสินค้า (ไม่มีสต็อก) → สต็อกเอาจาก /catalog/products/:id (cache เดียวกับหน้าสินค้า)
// สต็อกคิดรวมทุกบรรทัดของสินค้าเดียวกัน (ตัวเลือกต่างกันแต่ตัดสต็อกชิ้นเดียวกัน — เหมือน backend ตอนสร้างออเดอร์)
// เป็น UX เท่านั้น — backend ตรวจซ้ำตอนกดสั่งซื้อเสมอ
// ─────────────────────────────────────────────────────────────
import type { ShopCartItem } from "@/services/shopCart";

export type CartIssue =
  | { kind: "gone" } // สินค้าถูกลบ / ไม่พบ
  | { kind: "closed" } // ปิดการขาย (is_visible false)
  | { kind: "preorder" } // กลายเป็นสินค้าพรีออเดอร์ — สั่งผ่านรอบพรีออเดอร์
  | { kind: "soldOut" }
  | { kind: "notEnough"; left: number };

/** ข้อมูลสต็อกจาก catalog: null = ยังโหลดไม่เสร็จ/โหลดไม่ได้ (ไม่ตัดสิน) · "missing" = 404 (ซ่อน/ลบ) */
export type StockInfo = { stock: number | null } | "missing" | null;

export const cartProductId = (it: ShopCartItem): string | null =>
  it.product_id && typeof it.product_id === "object" ? it.product_id._id : typeof it.product_id === "string" ? it.product_id : null;

export function cartIssues(items: ShopCartItem[], stockOf: (productId: string) => StockInfo): Map<string, CartIssue> {
  const issues = new Map<string, CartIssue>();
  const qtyByProduct = new Map<string, number>();
  for (const it of items) {
    const id = cartProductId(it);
    if (id) qtyByProduct.set(id, (qtyByProduct.get(id) ?? 0) + it.quantity);
  }
  for (const it of items) {
    const id = cartProductId(it);
    const product = it.product_id && typeof it.product_id === "object" ? (it.product_id as { is_visible?: boolean; is_preorder?: boolean }) : null;
    if (!id || !product) {
      issues.set(it._id, { kind: "gone" });
      continue;
    }
    if (product.is_visible === false) {
      issues.set(it._id, { kind: "closed" });
      continue;
    }
    if (product.is_preorder) {
      issues.set(it._id, { kind: "preorder" });
      continue;
    }
    const info = stockOf(id);
    if (info === "missing") {
      issues.set(it._id, { kind: "closed" });
      continue;
    }
    if (!info || info.stock == null) continue;
    if (info.stock <= 0) issues.set(it._id, { kind: "soldOut" });
    else if ((qtyByProduct.get(id) ?? 0) > info.stock) issues.set(it._id, { kind: "notEnough", left: info.stock });
  }
  return issues;
}

/** ข้อความต่อบรรทัด (หน้าร้านยังเขียนไทยในโค้ด — ยกเว้นจาก lint:i18n) */
export function cartIssueText(issue: CartIssue): string {
  switch (issue.kind) {
    case "gone":
      return "ไม่มีสินค้านี้แล้ว — กรุณาลบออกจากตะกร้า";
    case "closed":
      return "สินค้านี้ปิดการขายชั่วคราว — กรุณาลบออกจากตะกร้า";
    case "preorder":
      return "สินค้านี้เป็นสินค้าพรีออเดอร์แล้ว — สั่งผ่านหน้าพรีออเดอร์";
    case "soldOut":
      return "สินค้าหมด — กรุณาลบออกจากตะกร้า";
    case "notEnough":
      return `สต็อกไม่พอ (เหลือ ${issue.left} ชิ้น รวมทุกตัวเลือก) — กรุณาลดจำนวน`;
  }
}
