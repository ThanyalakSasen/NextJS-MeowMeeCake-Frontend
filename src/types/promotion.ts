// ─────────────────────────────────────────────────────────────
// src/types/promotion.ts — DTO ของ /admin/promotions (promotionModel.ts จริงฝั่ง backend)
// backend ไม่ populate applicable_products/applicable_categories เลย — คืนมาเป็น string id array
// ดิบ ๆ ตรง ๆ ทั้ง GET และ POST/PATCH (ไม่ต้องผ่าน refId())
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { DiscountType } from "@/constants/enumConfig";

export type PromotionChannel = "online" | "instore";
/** all = ทุกคน (รวมลูกค้าทั่วไปที่ POS) · members = เฉพาะสมาชิก (บัญชีลูกค้าทั่วไปใช้ไม่ได้) */
export type PromotionAudience = "all" | "members";

export interface Promotion {
  _id: string;
  promotion_code: string;
  promotion_name: string;
  promotion_desc?: string | null;
  discount_type: DiscountType;
  /** บาทเสมอที่ API boundary — มีความหมายเป็นเงินเฉพาะตอน discount_type "Amount" (Percentage = 0-100 ดิบ) */
  discount_value: number;
  is_active: boolean;
  applicable_channels: PromotionChannel[];
  /** backend รุ่นเก่าไม่ส่ง = "all" */
  audience?: PromotionAudience;
  /** ใช้ร่วมกับโปรอื่นในบิลเดียวได้ (POS ซ้อนโปร) — backend รุ่นเก่าไม่ส่ง = false */
  stackable?: boolean;
  /** ใช้ร่วมได้เฉพาะโปรเหล่านี้ (id) — ว่าง/ไม่ส่ง = ร่วมกับทุกโปรที่ stackable · ซ้อนได้เมื่อทั้งสองฝั่งยอมกัน */
  stackable_with?: string[];
  min_order_amount?: number | null;
  applicable_products: string[];
  applicable_categories: string[];
  min_quantity?: number | null;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  max_user_per_user?: number | null;
  /** แต้มที่ลูกค้าใช้แลกเป็นคูปองส่วนตัว · null = ไม่เปิดให้แลก (customer-backend-merge.md §8.11) */
  points_cost?: number | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

/** body ตอน POST/PATCH — start_date/end_date บังคับจริงตอนสร้าง (schemas/promotion.ts promotionCreate)
 *  created_by ไม่ต้องส่ง — backend เติมจาก session ให้เองเสมอ */
export interface PromotionInput {
  promotion_code: string;
  promotion_name: string;
  discount_type: DiscountType;
  discount_value: number;
  is_active?: boolean;
  applicable_channels?: PromotionChannel[];
  audience?: PromotionAudience;
  stackable?: boolean;
  stackable_with?: string[];
  /** null = ล้างเงื่อนไข (ไม่จำกัด) · ไม่ส่ง = PATCH คงค่าเดิม — 5 ช่องนี้ backend รับ nullish */
  min_order_amount?: number | null;
  max_discount_amount?: number | null;
  applicable_products?: string[];
  applicable_categories?: string[];
  min_quantity?: number | null;
  usage_limit?: number | null;
  max_user_per_user?: number | null;
  /** จำนวนเต็มบวก · null = ปิดการแลกด้วยแต้ม */
  points_cost?: number | null;
  start_date: string;
  end_date: string;
}

export interface PromotionListParams extends ListParams {
  is_active?: boolean;
  discount_type?: DiscountType;
  activeNow?: boolean;
}
