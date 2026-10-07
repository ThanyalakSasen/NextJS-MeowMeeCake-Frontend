// ─────────────────────────────────────────────────────────────
// src/services/shopLoyalty.ts — แต้มสะสม + คูปองของฉัน (/shop/points · /shop/coupons) · หน้าร้าน
// ใช้ในหน้า checkout (BACKLOG3-merge C3): ส่ง user_coupon_id / points_to_redeem ตอนสร้างออเดอร์
// และหน้าสมาชิก /customer/account/member (D4): ยอด · แต้มใกล้หมดอายุ · ประวัติ · แลกคูปองด้วยแต้ม
// สูตรด้านล่างใช้แสดงยอดล่วงหน้าเท่านั้น — ต้องตรงกับ backend (pointsService.maxRedeemablePoints ·
// discountEngine.computeDiscount) · backend คิดใหม่เองทุกครั้งตอนสร้างออเดอร์
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";

export type DiscountType = "Percentage" | "Amount" | "FreeShipping";

/** = pointsService.POINT_RULES ของ backend */
export interface PointRules {
  /** ทุกกี่บาทได้ 1 แต้ม (25) */
  BAHT_PER_POINT: number;
  /** 1 แต้ม = กี่บาท (0.1) */
  POINT_VALUE_BAHT: number;
  MIN_BALANCE_TO_REDEEM: number;
  REDEEM_STEP: number;
  /** ใช้แต้มลดได้ไม่เกินสัดส่วนนี้ของยอดสินค้า (0.3) */
  MAX_REDEEM_RATIO: number;
  /** อายุแต้ม (วัน) */
  EXPIRY_DAYS: number;
  WELCOME: number;
  REVIEW: number;
  REVIEW_PHOTO: number;
  SHARE: number;
  PROFILE: number;
}

export interface PointHistoryItem {
  _id: string;
  type: "earn" | "redeem" | "expire" | "refund" | "revoke";
  /** ใช้/หมดอายุ/ถูกยกเลิก = ติดลบ */
  points: number;
  description: string;
  created_at: string;
}

/** GET /shop/points (pointsService.getMyPoints) — ประวัติ 50 รายการล่าสุด */
export interface MyPoints {
  balance: number;
  /** แต้มที่จะหมดอายุภายใน 30 วัน + วันแรกที่หมด */
  expiring_soon: { points: number; first_date: string | null };
  history: PointHistoryItem[];
  /** ได้โบนัสสมัครสมาชิก / กรอกข้อมูลครบ แล้วหรือยัง */
  bonuses: { welcome: boolean; profile: boolean };
  profile_complete: boolean;
  rules: PointRules;
}

/** คูปองที่แลกด้วยแต้มได้ (GET /shop/coupons → catalog) */
export interface CatalogCoupon {
  _id: string;
  promotion_name: string;
  promotion_desc: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  points_cost: number;
  end_date: string;
  /** แลกครบสิทธิ์ต่อคนแล้ว */
  limit_reached: boolean;
}

export interface MyCoupon {
  _id: string;
  promotion_code: string;
  promotion_name: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  expires_at: string;
  state: "available" | "used" | "expired";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** แต้มสูงสุดที่ใช้ได้กับยอดสินค้านี้ — 0 ถ้าแต้มยังไม่ถึงขั้นต่ำ (pointsService.maxRedeemablePoints) */
export function maxRedeemablePoints(balance: number, subtotal: number, r: PointRules): number {
  if (balance < r.MIN_BALANCE_TO_REDEEM) return 0;
  const cap = Math.floor((Math.max(0, subtotal) * r.MAX_REDEEM_RATIO) / r.POINT_VALUE_BAHT + 1e-9);
  const pts = Math.min(balance, cap);
  return pts - (pts % r.REDEEM_STEP);
}

export const pointsToBaht = (points: number, r: PointRules) => round2(points * r.POINT_VALUE_BAHT);

/**
 * ส่วนลดของคูปองของฉัน (รวมค่าส่งถ้าเป็นคูปองส่งฟรี) · null = ใช้กับออเดอร์นี้ไม่ได้ (พร้อมรหัสเหตุผล — ข้อความอยู่ฝั่งหน้าจอ)
 * คูปองไม่มีขอบเขตสินค้า/หมวด → คิดจากยอดสินค้าทั้งหมด (discountEngine.computeDiscount)
 */
export type CouponUnusableReason = "min_order" | "needs_delivery_fee" | "no_discount";

export function couponDiscount(
  c: Pick<MyCoupon, "discount_type" | "discount_value" | "min_order_amount" | "max_discount_amount">,
  subtotal: number,
  deliveryFee: number,
): { amount: number; reason: null } | { amount: null; reason: CouponUnusableReason } {
  if (c.min_order_amount && subtotal < c.min_order_amount) return { amount: null, reason: "min_order" };
  let amount: number;
  if (c.discount_type === "FreeShipping") {
    if (!(deliveryFee > 0)) return { amount: null, reason: "needs_delivery_fee" };
    amount = deliveryFee;
  } else if (c.discount_type === "Percentage") {
    amount = subtotal * (c.discount_value / 100);
    if (c.max_discount_amount != null) amount = Math.min(amount, c.max_discount_amount);
  } else {
    amount = Math.min(c.discount_value, subtotal);
  }
  amount = round2(Math.max(0, amount));
  return amount > 0 ? { amount, reason: null } : { amount: null, reason: "no_discount" };
}

export const shopLoyaltyService = {
  /** GET /shop/points — ยอด · ใกล้หมดอายุ · ประวัติ · โบนัส · กติกา (checkout ใช้แค่ balance + rules — cache key เดียวกัน) */
  points: async (): Promise<MyPoints> => (await http.get<ItemResponse<MyPoints>>("/shop/points")).data,
  /** GET /shop/coupons → คูปองของฉันที่ยังใช้ได้ (checkout) */
  availableCoupons: async (): Promise<MyCoupon[]> => {
    const res = await http.get<ItemResponse<{ coupons: MyCoupon[] }>>("/shop/coupons");
    return (res.data.coupons ?? []).filter((c) => c.state === "available");
  },
  /** GET /shop/coupons — คูปองที่แลกได้ + คูปองของฉันทุกสถานะ (ใหม่สุดก่อน · 100 ใบ) */
  overview: async (): Promise<{ catalog: CatalogCoupon[]; coupons: MyCoupon[] }> => {
    const res = await http.get<ItemResponse<{ catalog: CatalogCoupon[]; coupons: MyCoupon[] }>>("/shop/coupons");
    return { catalog: res.data.catalog ?? [], coupons: res.data.coupons ?? [] };
  },
  /** POST /shop/points/share { product_id } — แชร์สินค้าได้แต้ม ครั้งเดียวต่อสินค้า → แต้มที่ได้ (0 = เคยได้แล้ว) */
  share: async (productId: string): Promise<number> => {
    const res = await http.post<ItemResponse<{ awarded: number }>>("/shop/points/share", { product_id: productId });
    return Number(res.data?.awarded ?? 0);
  },
  /** POST /shop/coupons/redeem { promotion_id } — หักแต้มแล้วได้คูปองของฉัน 1 ใบ (แต้มไม่พอ/ครบสิทธิ์ = 400) */
  redeem: async (promotionId: string): Promise<void> => {
    await http.post("/shop/coupons/redeem", { promotion_id: promotionId });
  },
};
