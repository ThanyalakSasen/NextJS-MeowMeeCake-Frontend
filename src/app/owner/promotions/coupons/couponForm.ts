// ─────────────────────────────────────────────────────────────
// couponForm.ts — helper ล้วนของฟอร์มคูปอง (ใช้ร่วม Add / Edit) + สถานะคูปอง
// ไม่มีช่อง "กลุ่มลูกค้า" (ทั่วไป/ใหม่เท่านั้น) เพราะ backend ไม่มี concept นี้รองรับเลย — ถ้าใส่ไว้จะ
// เป็นแค่ label หลอกไม่มีผลจริง (บั๊กคลาสเดียวกับปุ่ม deactivate พนักงานที่เจอมาก่อนหน้านี้)
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import type { CouponStatus, DiscountType } from "@/constants/enumConfig";
import type { Promotion, PromotionChannel, PromotionInput } from "@/types/promotion";

export type CouponScope = "all" | "category" | "product";

export interface CouponFormValue {
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue?: number;
  minOrder?: number;
  scope: CouponScope;
  productIds: string[];
  categoryIds: string[];
  minQuantity?: number;
  dateRange?: [Dayjs, Dayjs] | null;
  usageLimit?: number;
  perCustomer?: number;
  chInstore: boolean;
  chOnline: boolean;
}

export const emptyCouponForm: CouponFormValue = {
  code: "",
  name: "",
  discountType: "Percentage",
  scope: "all",
  productIds: [],
  categoryIds: [],
  chInstore: true,
  chOnline: true,
};

export function fromPromotion(p: Promotion): CouponFormValue {
  return {
    code: p.promotion_code,
    name: p.promotion_name,
    discountType: p.discount_type,
    discountValue: p.discount_value || undefined,
    minOrder: p.min_order_amount ?? undefined,
    scope: p.applicable_products.length > 0 ? "product" : p.applicable_categories.length > 0 ? "category" : "all",
    productIds: p.applicable_products,
    categoryIds: p.applicable_categories,
    minQuantity: p.min_quantity ?? undefined,
    dateRange: p.start_date && p.end_date ? [dayjs(p.start_date), dayjs(p.end_date)] : null,
    usageLimit: p.usage_limit ?? undefined,
    perCustomer: p.max_user_per_user ?? undefined,
    chInstore: p.applicable_channels.includes("instore"),
    chOnline: p.applicable_channels.includes("online"),
  };
}

/**
 * ค่าจากฟอร์ม → body ที่ส่งเข้า API — created_by ไม่ต้องส่ง (backend เติมจาก session เอง)
 * ไม่ได้เลือกช่วงวันที่ไว้ (ปล่อยว่าง) → default วันนี้ถึงอีก 1 ปี ให้อัตโนมัติ เพราะ start_date/
 * end_date backend บังคับ required เสมอตอนสร้าง (schemas/promotion.ts)
 */
export function toInput(v: CouponFormValue): PromotionInput {
  const isProductScope = v.scope === "product";
  const isCategoryScope = v.scope === "category";
  const channels: PromotionChannel[] = [
    ...(v.chInstore ? (["instore"] as const) : []),
    ...(v.chOnline ? (["online"] as const) : []),
  ];
  const [start, end] = v.dateRange ?? [];
  return {
    promotion_code: v.code.trim().toUpperCase().replace(/\s/g, ""),
    promotion_name: v.name.trim(),
    discount_type: v.discountType,
    discount_value: v.discountValue ?? 0,
    min_order_amount: v.minOrder || undefined,
    applicable_products: isProductScope ? v.productIds : [],
    applicable_categories: isCategoryScope ? v.categoryIds : [],
    min_quantity: isProductScope || isCategoryScope ? v.minQuantity : undefined,
    usage_limit: v.usageLimit || undefined,
    max_user_per_user: v.perCustomer || undefined,
    applicable_channels: channels.length > 0 ? channels : ["online", "instore"],
    start_date: (start ?? dayjs()).startOf("day").toISOString(),
    end_date: (end ?? dayjs().add(1, "year")).endOf("day").toISOString(),
  };
}

// ── สถานะคูปอง (คำนวณฝั่ง frontend — ไม่มีใน DB ตรง ๆ) ──────
export function deriveCouponStatus(p: Pick<Promotion, "is_active" | "start_date" | "end_date">): CouponStatus {
  if (!p.is_active) return "inactive";
  const now = dayjs();
  if (p.end_date && dayjs(p.end_date).isBefore(now, "day")) return "expired";
  if (p.start_date && dayjs(p.start_date).isAfter(now, "day")) return "scheduled";
  return "active";
}

export function usagePct(p: Pick<Promotion, "used_count" | "usage_limit">): number {
  if (!p.usage_limit) return 0;
  return Math.round((p.used_count / p.usage_limit) * 100);
}
