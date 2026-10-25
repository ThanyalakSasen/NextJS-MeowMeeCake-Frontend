"use client";
// ─────────────────────────────────────────────────────────────
// คูปองของฉัน (แลกด้วยแต้ม) ในหน้าชำระเงิน — แทน FrontOffice CouponSelectBox
// เลือกได้ใบเดียว · ใช้คู่กับโค้ดส่วนลดไม่ได้ (หน้า checkout ล้างอีกฝั่งให้) · ส่วนลดที่แสดงเป็นยอดประมาณจาก couponDiscount()
// UX: ใช้ได้กับออเดอร์นี้ขึ้นก่อน (ลดมากสุดก่อน + ป้าย "คุ้มที่สุด") · ใช้ไม่ได้แยกไว้ล่างสุด บอกเหตุผล กดเลือกไม่ได้
//     แสดง 3 ใบแรก ที่เหลือกด "ดูทั้งหมด" · กดใบที่เลือกอยู่ซ้ำ = เลิกใช้
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Circle, Ticket } from "lucide-react";
import { couponDiscount, type CouponUnusableReason, type MyCoupon } from "@/services/shopLoyalty";
import { baht } from "@/components/customer/shopStyles";
import { formatDate } from "@/i18n/format";
import CouponTicket, { daysLeft } from "./CouponTicket";

const PREVIEW = 3;

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
  codeApplied = false,
}: {
  coupons: MyCoupon[];
  selectedId: string | null;
  subtotal: number;
  deliveryFee: number;
  onSelect: (id: string | null) => void;
  /** มีโค้ดส่วนลดใช้อยู่ — เลือกคูปองจะยกเลิกโค้ด */
  codeApplied?: boolean;
}) {
  const t = useTranslations("shop.coupons");
  const locale = useLocale();
  const [showAll, setShowAll] = useState(false);
  if (coupons.length === 0) return null;

  const rows = coupons.map((c) => ({ c, result: couponDiscount(c, subtotal, deliveryFee) }));
  const usable = rows.filter((r) => r.result.amount !== null).sort((a, b) => (b.result.amount ?? 0) - (a.result.amount ?? 0));
  const unusable = rows.filter((r) => r.result.amount === null);
  const bestId = usable.length > 1 ? usable[0].c._id : null;
  const ordered = [...usable, ...unusable];
  // ใบที่เลือกอยู่ต้องเห็นเสมอ แม้อยู่หลังใบที่ 3
  const shown = showAll ? ordered : ordered.filter((r, i) => i < PREVIEW || r.c._id === selectedId);
  const hidden = ordered.length - shown.length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 flex items-center gap-1.5 text-sm font-bold text-[#4A342E]">
          <Ticket className="h-4 w-4" aria-hidden="true" /> {t("title")}
        </p>
        <span className="text-xs text-stone-500">{t("usableCount", { n: usable.length, total: coupons.length })}</span>
      </div>
      {codeApplied && <p className="m-0 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t("replacesCode")}</p>}

      <div className="space-y-2.5" role="radiogroup" aria-label={t("title")}>
        {shown.map(({ c, result }) => {
          const active = c._id === selectedId;
          const usableHere = result.amount !== null;
          const left = daysLeft(c.expires_at);
          return (
            <button
              key={c._id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={!usableHere && !active}
              // ใช้ไม่ได้ = กดไม่ได้ (ยกเว้นใบที่เลือกค้างไว้ — กดเพื่อเลิกใช้)
              onClick={() => (usableHere || active) && onSelect(active ? null : c._id)}
              className={`block w-full text-left ${usableHere || active ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              <CouponTicket
                coupon={c}
                surface="card"
                selected={active}
                muted={!usableHere}
                className={usableHere && !active ? "hover:border-[#8C5A3C]/50" : ""}
                badge={
                  active ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#8C5A3C]" aria-hidden="true" />
                  ) : usableHere ? (
                    <Circle className="h-5 w-5 shrink-0 text-stone-300" aria-hidden="true" />
                  ) : null
                }
                meta={
                  <>
                    {c.min_order_amount > 0 && <span>{t("minOrderShort", { amount: baht(c.min_order_amount) })} · </span>}
                    {left !== null ? (
                      <span className="font-semibold text-red-600">{left === 0 ? t("expiresToday") : t("expiresInDays", { n: left })}</span>
                    ) : (
                      <span>{t("validUntilShort", { date: formatDate(c.expires_at, locale) })}</span>
                    )}
                  </>
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {usableHere ? (
                    <span className="text-sm font-bold text-emerald-700">{t("saveAmount", { amount: baht(result.amount ?? 0) })}</span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700">
                      {reasonText(result.reason!, c, t)}
                      {active && t("notApplied")}
                    </span>
                  )}
                  {c._id === bestId && !active && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">{t("best")}</span>
                  )}
                </div>
              </CouponTicket>
            </button>
          );
        })}
      </div>

      {(hidden > 0 || showAll) && ordered.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="flex h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold text-[#8C5A3C] transition hover:bg-[#8C5A3C]/10"
        >
          {showAll ? t("showLess") : t("showAll", { n: hidden })}
        </button>
      )}
    </div>
  );
}
