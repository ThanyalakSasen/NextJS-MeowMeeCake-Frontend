// ─────────────────────────────────────────────────────────────
// couponForm.ts — helper ล้วนของฟอร์มคูปอง (ใช้ร่วม Add / Edit) + สถานะคูปอง
// กลุ่มลูกค้า (audience): ทุกคน / เฉพาะสมาชิก — backend ตรวจจริงตอนสร้างออเดอร์ (บัญชีลูกค้าทั่วไปของ POS ใช้โปรสมาชิกไม่ได้)
// ใช้ร่วมกับโปรอื่น (stackable): POS เลือกโปรได้หลายตัวเมื่อทุกตัวเปิดช่องนี้
//   stackWith: เลือกได้ว่าร่วมกับโปรไหน (ว่าง = ทุกโปรที่เปิดช่องนี้) — ซ้อนได้เมื่อทั้งสองฝั่งยอมกัน
// ─────────────────────────────────────────────────────────────
import dayjs, { type Dayjs } from "dayjs";
import type { CouponStatus, DiscountType } from "@/constants/enumConfig";
import type { Promotion, PromotionAudience, PromotionChannel, PromotionInput } from "@/types/promotion";

export type CouponScope = "all" | "category" | "product";

export interface CouponFormValue {
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue?: number;
  minOrder?: number;
  /** เพดานส่วนลด (บาท) — ใช้เฉพาะแบบ Percentage · ว่าง = ไม่จำกัด */
  maxDiscount?: number;
  scope: CouponScope;
  productIds: string[];
  categoryIds: string[];
  minQuantity?: number;
  dateRange?: [Dayjs, Dayjs] | null;
  usageLimit?: number;
  perCustomer?: number;
  /** แต้มที่ลูกค้าใช้แลกเป็นคูปองส่วนตัว (หน้าเว็บ) · ว่าง = แลกไม่ได้ — backend points_cost (§8.11) */
  pointsCost?: number;
  chInstore: boolean;
  chOnline: boolean;
  audience: PromotionAudience;
  stackable: boolean;
  /** id โปรที่ใช้ร่วมได้ · ว่าง = ทุกโปรที่ stackable */
  stackWith: string[];
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
  audience: "all",
  stackable: false,
  stackWith: [],
};

export function fromPromotion(p: Promotion): CouponFormValue {
  return {
    code: p.promotion_code,
    name: p.promotion_name,
    discountType: p.discount_type,
    discountValue: p.discount_value || undefined,
    minOrder: p.min_order_amount ?? undefined,
    maxDiscount: p.max_discount_amount ?? undefined,
    scope: p.applicable_products.length > 0 ? "product" : p.applicable_categories.length > 0 ? "category" : "all",
    productIds: p.applicable_products,
    categoryIds: p.applicable_categories,
    minQuantity: p.min_quantity ?? undefined,
    dateRange: p.start_date && p.end_date ? [dayjs(p.start_date), dayjs(p.end_date)] : null,
    usageLimit: p.usage_limit ?? undefined,
    perCustomer: p.max_user_per_user ?? undefined,
    pointsCost: p.points_cost ?? undefined,
    chInstore: p.applicable_channels.includes("instore"),
    chOnline: p.applicable_channels.includes("online"),
    audience: p.audience ?? "all",
    stackable: p.stackable ?? false,
    stackWith: p.stackable_with ?? [],
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
    // ช่องว่าง/0 = null (ไม่ใช่ undefined) — axios ตัด undefined ออกจาก JSON แล้ว PATCH คงค่าเดิมไว้
    // ล้างช่องตอนแก้ไขจึงไม่เคยล้างได้ · ขอบเขตทั้งบิลล้าง min_quantity ด้วย ไม่งั้นค่าที่ซ่อนอยู่นับชิ้นทั้งบิล
    min_order_amount: v.minOrder || null,
    // เพดานมีผลเฉพาะ Percentage (discountEngine) — เปลี่ยนเป็นแบบอื่นแล้วล้างทิ้ง ไม่ให้ค่าที่ซ่อนอยู่ค้าง
    max_discount_amount: v.discountType === "Percentage" && v.maxDiscount ? v.maxDiscount : null,
    applicable_products: isProductScope ? v.productIds : [],
    applicable_categories: isCategoryScope ? v.categoryIds : [],
    min_quantity: (isProductScope || isCategoryScope) && v.minQuantity ? v.minQuantity : null,
    usage_limit: v.usageLimit || null,
    max_user_per_user: v.perCustomer || null,
    // null (ไม่ใช่ undefined) — ล้างช่องตอนแก้ไขต้องปิดการแลกจริง ไม่ใช่คงค่าเดิมไว้
    points_cost: v.pointsCost && v.pointsCost > 0 ? Math.round(v.pointsCost) : null,
    applicable_channels: channels.length > 0 ? channels : ["online", "instore"],
    audience: v.audience,
    stackable: v.stackable,
    stackable_with: v.stackable ? (v.stackWith ?? []) : [],
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
