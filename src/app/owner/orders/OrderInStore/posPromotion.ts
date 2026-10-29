// ─────────────────────────────────────────────────────────────
// posPromotion.ts — pure: โปรโมชันของการขายหน้าร้าน (POS)
//
// พรีวิวส่วนลดก่อนกดยืนยัน ด้วยกติกาเดียวกับ backend src/lib/discountEngine.ts computeDiscount()
// (ช่องทาง · สินค้า/หมวดที่ร่วมรายการ · ขั้นต่ำยอด/จำนวน · Percentage + เพดาน / Amount) — ตัวเลขที่ใช้จริง
// backend คิดใหม่เองเสมอตอนสร้างออเดอร์ (ส่ง promotion_id ไป ไม่ส่ง discount_amount) ที่นี่แค่ให้พนักงานเห็นก่อน
//
// ไม่ตรวจ is_active / ช่วงวันที่ — โหลดด้วย activeNow=true แล้ว (backend กรองให้) · usage_limit เช็คจาก used_count
// ที่โหลดมา · โปรสำหรับสมาชิก = ตั้ง audience "members" หรือจำกัดสิทธิ์ต่อลูกค้า (max_user_per_user): ไม่กรอกเบอร์สมาชิก
// → เลือกไม่ได้ (backend ปฏิเสธบัญชี "ลูกค้าทั่วไป" · โปรจำกัดสิทธิ์ต่อคนนับที่บัญชีเดียว ใช้ครั้งเดียวก็เต็ม)
// ซ้อนโปร: เลือกได้หลายตัวเมื่อทุกตัวตั้ง stackable (สูงสุด MAX_STACKED_PROMOTIONS) · แต่ละตัวคิดจากบิลเดียวกันแล้วรวม
// stackable_with: ทุกคู่ต้องยอมกันทั้งสองฝั่ง (ว่าง = ยอมทุกโปรที่ stackable)
// (กติกาเดียวกับ backend orderService) · โปรที่ไม่ได้ตั้ง stackable ใช้ได้ตัวเดียว
// จำนวนที่สมาชิกใช้ไปแล้วเช็คฝั่ง client ไม่ได้ — backend ตรวจตอนสร้างออเดอร์
// FreeShipping ตัดทิ้ง: ขายหน้าร้าน = takeaway ไม่มีค่าส่ง backend ปฏิเสธเสมอ
// ─────────────────────────────────────────────────────────────
import type { Promotion } from "@/types/promotion";

export interface PromoLine {
  productId: string;
  categoryId: string | null;
  qty: number;
  lineTotal: number;
}

export type PromoBlock =
  | { key: "noEligibleItems" }
  | { key: "minAmount"; min: number; current: number }
  | { key: "minQty"; min: number; current: number }
  | { key: "usedUp" }
  | { key: "memberOnly" }
  | { key: "zero" };

export interface PromoEval {
  promotion: Promotion;
  /** ใช้กับบิลนี้ได้ไหม (ผ่านทุกเงื่อนไขที่เช็คได้ฝั่ง client) */
  eligible: boolean;
  /** ส่วนลดที่จะได้ (บาท) — 0 ถ้าใช้ไม่ได้ */
  discount: number;
  /** เหตุผลที่ยังใช้ไม่ได้ (eligible = false) */
  block?: PromoBlock;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** โปรโมชันที่ใช้กับการขายหน้าร้านได้: ช่องทาง instore และไม่ใช่ส่งฟรี */
export function posPromotions(all: Promotion[]): Promotion[] {
  return all.filter((p) => p.applicable_channels.includes("instore") && p.discount_type !== "FreeShipping");
}

/** โปรโมชันนี้จำกัดเฉพาะสินค้า/หมวดหรือไม่ — ไม่จำกัด = ลดทั้งบิล */
export function isScoped(p: Promotion): boolean {
  return p.applicable_products.length > 0 || p.applicable_categories.length > 0;
}

/** สินค้านี้ร่วมรายการโปรโมชันนี้ไหม (เฉพาะโปรที่จำกัดสินค้า/หมวด — โปรทั้งบิลไม่นับเป็น "โปรของสินค้า") */
export function appliesToProduct(p: Promotion, productId: string, categoryId: string | null): boolean {
  return p.applicable_products.includes(productId) || (!!categoryId && p.applicable_categories.includes(categoryId));
}

/** โปรโมชันที่ผูกกับสินค้าตัวนี้ (ใช้ทำป้าย/แจ้งเตือนต่อสินค้า) */
export function promotionsForProduct(promos: Promotion[], productId: string, categoryId: string | null): Promotion[] {
  return promos.filter((p) => isScoped(p) && appliesToProduct(p, productId, categoryId));
}

/** โปรสำหรับสมาชิก — ตั้งเฉพาะสมาชิก หรือจำกัดสิทธิ์ต่อลูกค้า (ต้องรู้ว่าเป็นลูกค้าคนไหนถึงนับสิทธิ์ได้) */
export function isMemberOnly(p: Promotion): boolean {
  return p.audience === "members" || p.max_user_per_user != null;
}

/** 2 โปรนี้อยู่บิลเดียวกันได้ไหม — กติกาเดียวกับ backend orderService: ทั้งคู่ stackable และ stackable_with
 *  ของแต่ละฝั่งว่าง (ยอมทุกตัว) หรือมีอีกฝั่งอยู่ */
export function canStack(a: Promotion, b: Promotion): boolean {
  const allows = (x: Promotion, y: Promotion) => !x.stackable_with?.length || x.stackable_with.includes(y._id);
  return a.stackable === true && b.stackable === true && allows(a, b) && allows(b, a);
}

/** backend รับ promotion_ids ได้ไม่เกินเท่านี้ (schemas/order.ts) */
export const MAX_STACKED_PROMOTIONS = 5;

/**
 * กดเลือก/ยกเลิกโปร 1 ตัว → รายการ id ที่เลือกใหม่
 * กดตัวที่เลือกอยู่ = เอาออก · ตัวใหม่ไม่ใช่ stackable หรือที่เลือกอยู่มีตัวที่ไม่ใช่ stackable = แทนที่ทั้งหมด ·
 * ตัวใหม่ใช้ร่วมกับตัวที่เลือกอยู่ไม่ได้ (stackable_with) = แทนที่ทั้งหมด เช่นกัน ·
 * ทุกตัวใช้ร่วมกันได้ = เพิ่มต่อท้าย (เต็มแล้วไม่เพิ่ม)
 */
export function togglePromoSelection(selected: string[], promo: Promotion, all: Promotion[]): string[] {
  if (selected.includes(promo._id)) return selected.filter((id) => id !== promo._id);
  const fits = (id: string) => {
    const other = all.find((p) => p._id === id);
    return other != null && canStack(promo, other);
  };
  if (!selected.every(fits)) return [promo._id];
  return selected.length >= MAX_STACKED_PROMOTIONS ? selected : [...selected, promo._id];
}

/** คิดโปรโมชัน 1 ตัวกับบิลปัจจุบัน — กติกาเดียวกับ discountEngine.computeDiscount() (ยกเว้นช่องทาง/ส่งฟรีที่กรองไปแล้ว)
 *  hasMember = กรอกเบอร์สมาชิกแล้ว (โปรสำหรับสมาชิกใช้ได้เฉพาะตอนนั้น) */
export function evaluatePromotion(p: Promotion, lines: PromoLine[], hasMember = false): PromoEval {
  const fail = (block: PromoBlock): PromoEval => ({ promotion: p, eligible: false, discount: 0, block });

  if (p.usage_limit != null && p.used_count >= p.usage_limit) return fail({ key: "usedUp" });
  if (isMemberOnly(p) && !hasMember) return fail({ key: "memberOnly" });

  const eligibleLines = isScoped(p) ? lines.filter((l) => appliesToProduct(p, l.productId, l.categoryId)) : lines;
  if (isScoped(p) && eligibleLines.length === 0) return fail({ key: "noEligibleItems" });

  const amount = round2(eligibleLines.reduce((s, l) => s + l.lineTotal, 0));
  const qty = eligibleLines.reduce((s, l) => s + l.qty, 0);

  if (p.min_order_amount != null && amount < p.min_order_amount) {
    return fail({ key: "minAmount", min: p.min_order_amount, current: amount });
  }
  if (p.min_quantity != null && qty < p.min_quantity) {
    return fail({ key: "minQty", min: p.min_quantity, current: qty });
  }

  let discount = 0;
  if (p.discount_type === "Percentage") {
    discount = amount * (p.discount_value / 100);
    if (p.max_discount_amount != null) discount = Math.min(discount, p.max_discount_amount);
  } else if (p.discount_type === "Amount") {
    discount = Math.min(p.discount_value, amount);
  }
  discount = round2(Math.max(0, discount));
  if (discount <= 0) return fail({ key: "zero" });

  return { promotion: p, eligible: true, discount };
}

/** คิดทุกโปรกับบิลนี้ — เรียงที่ใช้ได้ก่อน ส่วนลดมากก่อน */
export function evaluateAll(promos: Promotion[], lines: PromoLine[], hasMember = false): PromoEval[] {
  if (lines.length === 0) return [];
  return promos
    .map((p) => evaluatePromotion(p, lines, hasMember))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.discount - a.discount);
}
