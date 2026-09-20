// ─────────────────────────────────────────────────────────────
// src/types/promotion.ts — DTO ของ /admin/promotions (promotionModel.ts จริงฝั่ง backend)
// backend ไม่ populate applicable_products/applicable_categories เลย — คืนมาเป็น string id array
// ดิบ ๆ ตรง ๆ ทั้ง GET และ POST/PATCH (ไม่ต้องผ่าน refId())
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { DiscountType } from "@/constants/enumConfig";

export type PromotionChannel = "online" | "instore";

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
  min_order_amount?: number | null;
  applicable_products: string[];
  applicable_categories: string[];
  min_quantity?: number | null;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  max_user_per_user?: number | null;
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
  min_order_amount?: number;
  applicable_products?: string[];
  applicable_categories?: string[];
  min_quantity?: number;
  usage_limit?: number;
  max_user_per_user?: number;
  start_date: string;
  end_date: string;
}

export interface PromotionListParams extends ListParams {
  is_active?: boolean;
  discount_type?: DiscountType;
  activeNow?: boolean;
}
