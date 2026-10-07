// ข้อความสรุปส่วนลดของคูปอง — ใช้ร่วมกันหน้า checkout (CouponSelectBox) และหน้าสมาชิก
import type { MyCoupon } from "@/services/shopLoyalty";
import { baht } from "@/components/customer/shopStyles";

export function couponLabel(c: Pick<MyCoupon, "discount_type" | "discount_value" | "max_discount_amount">): string {
  if (c.discount_type === "Percentage") {
    return `ลด ${c.discount_value}%${c.max_discount_amount ? ` (สูงสุด ${baht(c.max_discount_amount)})` : ""}`;
  }
  if (c.discount_type === "Amount") return `ลด ${baht(c.discount_value)}`;
  return "ส่งฟรี";
}
