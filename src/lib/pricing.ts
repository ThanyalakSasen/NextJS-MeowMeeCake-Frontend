// ─────────────────────────────────────────────────────────────
// src/lib/pricing.ts — ย้ายมาจาก FrontOffice (lib/pricing.ts) โดยไม่แก้ logic
// ราคาขายจริงของสินค้า — ตัดสินว่าใช้ราคาลด (sale_price) หรือราคาปกติ (product_price)
// ราคาลดมีผลเมื่อเป็นตัวเลข ≥ 0 และ "ต่ำกว่า" ราคาปกติเท่านั้น — null / ว่าง / ไม่ต่ำกว่า = ไม่มีโปรโมชัน
// หน้าเว็บใช้แสดงผลเท่านั้น: ยอดเงินที่ลูกค้าจ่าย backend คิดใหม่จากราคาใน DB เสมอ
// ─────────────────────────────────────────────────────────────

export interface PricedProduct {
  product_price?: number | null;
  sale_price?: number | null;
}

/** มีราคาลดที่ใช้ได้จริงหรือไม่ */
export function hasSalePrice(p: PricedProduct | null | undefined): boolean {
  const base = Number(p?.product_price ?? 0);
  const sale = p?.sale_price;
  return typeof sale === "number" && Number.isFinite(sale) && sale >= 0 && sale < base;
}

/** ราคาขายจริงต่อชิ้น — ราคาลดถ้ามี ไม่งั้นราคาปกติ */
export function effectivePrice(p: PricedProduct | null | undefined): number {
  return hasSalePrice(p) ? Number(p?.sale_price) : Number(p?.product_price ?? 0);
}

/** ส่วนลดเป็นเปอร์เซ็นต์ (ปัดเป็นจำนวนเต็ม) สำหรับป้าย "-20%" — 0 ถ้าไม่มีราคาลด */
export function salePercent(p: PricedProduct | null | undefined): number {
  if (!hasSalePrice(p)) return 0;
  const base = Number(p?.product_price ?? 0);
  return base > 0 ? Math.round((1 - Number(p?.sale_price) / base) * 100) : 0;
}
