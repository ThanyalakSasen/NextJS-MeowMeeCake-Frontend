"use client";
// ─────────────────────────────────────────────────────────────
// คูปองของฉัน (แลกด้วยแต้ม) — แทน FrontOffice CouponSelectBox
// เลือกได้ใบเดียว · ใช้คู่กับโค้ดส่วนลดไม่ได้ (หน้า checkout ล้างอีกฝั่งให้) · ส่วนลดที่แสดงเป็นยอดประมาณจาก couponDiscount()
// ─────────────────────────────────────────────────────────────
import { useLocale, useTranslations } from "next-intl";
import { couponDiscount, type CouponUnusableReason, type MyCoupon } from "@/services/shopLoyalty";
import { baht } from "@/components/customer/shopStyles";
import { couponLabel } from "@/app/customer/lib/couponLabel";
import { formatDate } from "@/i18n/format";

function reasonText(reason: CouponUnusableReason, c: MyCoupon, t: ReturnType<typeof useTranslations<"shop.coupons">>): string {
  if (reason === "min_order") return t("minNotReached", { amount: baht(c.min_order_amount) });
  if (reason === "needs_delivery_fee") return t("needsDeliveryFee");
  return t("noDiscount");
}

export default function CouponSelectBox({
  coupons,
  selectedId,
  subtotal,
  deliveryFee,
  onSelect,
}: {
  coupons: MyCoupon[];
  selectedId: string | null;
  subtotal: number;
  deliveryFee: number;
  onSelect: (id: string | null) => void;
}) {
  const t = useTranslations("shop.coupons");
  const locale = useLocale();
  if (coupons.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{t("title")}</p>
      <div className="max-h-64 space-y-2 overflow-y-auto" role="radiogroup" aria-label={t("title")}>
        {coupons.map((c) => {
          const active = c._id === selectedId;
          const result = couponDiscount(c, subtotal, deliveryFee);
          return (
            <button
              key={c._id}
              type="button"
              role="radio"
              aria-checked={active}
              // กดซ้ำ = เลิกใช้คูปอง
              onClick={() => onSelect(active ? null : c._id)}
              className={`w-full rounded-xl border-2 border-dashed p-3 text-left text-sm transition ${
                active ? "border-[#8C5A3C] bg-[#FAF6F0]" : "border-gray-200 hover:border-[#8C5A3C]/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold">{couponLabel(c, t)}</span>
                {result.amount !== null && <span className="shrink-0 font-semibold text-green-700">-{baht(result.amount)}</span>}
              </div>
              <p className="text-xs text-gray-600">{c.promotion_name}</p>
              <p className="text-xs text-gray-500">
                {c.min_order_amount > 0 && t("minOrder", { amount: baht(c.min_order_amount) })}
                {t("validUntil", { date: formatDate(c.expires_at, locale) })}
              </p>
              {result.reason && (
                <p className="text-xs text-amber-700">
                  {reasonText(result.reason, c, t)}
                  {active && t("notApplied")}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
