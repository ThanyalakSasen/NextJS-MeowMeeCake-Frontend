// ข้อความสรุปส่วนลดของคูปอง — ใช้ร่วมกันหน้า checkout (CouponSelectBox) และหน้าสมาชิก · t = useTranslations("shop.coupons")
import type { useTranslations } from "next-intl";
import type { MyCoupon } from "@/services/shopLoyalty";
import { baht } from "@/components/customer/shopStyles";

export function couponLabel(
  c: Pick<MyCoupon, "discount_type" | "discount_value" | "max_discount_amount">,
  t: ReturnType<typeof useTranslations<"shop.coupons">>,
): string {
  if (c.discount_type === "Percentage") {
    return c.max_discount_amount
      ? t("percentOffMax", { percent: c.discount_value, max: baht(c.max_discount_amount) })
      : t("percentOff", { percent: c.discount_value });
  }
  if (c.discount_type === "Amount") return t("amountOff", { amount: baht(c.discount_value) });
  return t("freeShipping");
}
