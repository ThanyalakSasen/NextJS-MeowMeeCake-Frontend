"use client";
// ─────────────────────────────────────────────────────────────
// คูปองของฉัน (แลกด้วยแต้ม) ในหน้าชำระเงิน — แทน FrontOffice CouponSelectBox · หน้าตาแบบตั๋ว (CouponTicket)
// - ใบที่ใช้ได้ขึ้นก่อน (ส่วนลดมากสุดก่อน) · ใบที่ลดได้มากที่สุดมีป้าย "คุ้มที่สุด"
// - ใบที่ใช้ไม่ได้กับออเดอร์นี้: กดไม่ได้ + บอกเหตุผล (ยอดไม่ถึงขั้นต่ำ · ต้องมีค่าจัดส่ง ฯลฯ) · ถ้าเลือกค้างไว้ก่อนเงื่อนไขเปลี่ยน กดเพื่อเลิกเลือกได้
// เลือกได้ใบเดียว · กดซ้ำ = เลิกใช้ · ใช้คู่กับโค้ดส่วนลดไม่ได้ (หน้า checkout ล้างอีกฝั่งให้) · ยอดเป็นค่าประมาณจาก couponDiscount()
// ─────────────────────────────────────────────────────────────
import { useLocale, useTranslations } from "next-intl";
import { couponDiscount, type CouponUnusableReason, type MyCoupon } from "@/services/shopLoyalty";
import { baht } from "@/components/customer/shopStyles";
import { couponLabel } from "@/app/customer/lib/couponLabel";
import { formatDate } from "@/i18n/format";
import { CouponTicket } from "./CouponTicket";

function reasonText(reason: CouponUnusableReason, c: MyCoupon, t: ReturnType<typeof useTranslations<"shop.coupons">>): string {
  if (reason === "min_order") return t("minNotReached", { amount: baht(c.min_order_amount) });
  if (reason === "needs_delivery_fee") return t("needsDeliveryFee");
  if (reason === "exceeds_total") return t("exceedsTotal", { amount: baht(c.discount_value) });
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

  const rows = coupons
    .map((c) => ({ c, r: couponDiscount(c, subtotal, deliveryFee) }))
    .sort((a, b) => (b.r.amount ?? -1) - (a.r.amount ?? -1) || a.c.expires_at.localeCompare(b.c.expires_at));
  const best = rows[0]?.r.amount != null ? rows[0].c._id : null;
  const usable = rows.filter((x) => x.r.amount != null).length;

  return (
    <div className="space-y-2">
      <p className="m-0 flex items-center justify-between gap-2 text-sm font-semibold">
        {t("title")}
        <span className="text-xs font-normal text-stone-500">{t("usableCount", { n: usable, total: rows.length })}</span>
      </p>
      <div className="max-h-80 space-y-2.5 overflow-y-auto p-0.5" role="radiogroup" aria-label={t("title")}>
        {rows.map(({ c, r }) => {
          const active = c._id === selectedId;
          const unusable = r.amount == null;
          return (
            <button
              key={c._id}
              type="button"
              role="radio"
              aria-checked={active}
              // ใช้ไม่ได้ = กดไม่ได้ (ยกเว้นเลือกค้างไว้ — กดเพื่อเลิกเลือก)
              disabled={unusable && !active}
              onClick={() => onSelect(active ? null : c._id)}
              className="block w-full rounded-2xl text-left disabled:cursor-not-allowed"
            >
              <CouponTicket
                type={c.discount_type}
                value={c.discount_value}
                title={c.promotion_name}
                muted={unusable}
                selected={active}
                ribbon={c._id === best && usable > 1 ? t("bestValue") : undefined}
                lines={[
                  couponLabel(c, t),
                  `${c.min_order_amount > 0 ? t("minOrder", { amount: baht(c.min_order_amount) }) : ""}${t("validUntil", { date: formatDate(c.expires_at, locale) })}`,
                ]}
              >
                {unusable ? (
                  <p className="m-0 text-xs font-semibold text-amber-700">
                    {reasonText(r.reason ?? "no_discount", c, t)}
                    {active && t("notApplied")}
                  </p>
                ) : (
                  <p className="m-0 text-sm font-bold text-green-700">{t("saves", { amount: baht(r.amount ?? 0) })}</p>
                )}
              </CouponTicket>
            </button>
          );
        })}
      </div>
    </div>
  );
}
