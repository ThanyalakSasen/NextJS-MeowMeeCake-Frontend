"use client";
// การ์ดคูปองแบบ "ตั๋ว" — ใช้ร่วมกันหน้าสมาชิก (คูปองของฉัน · แลกแต้ม) และหน้าชำระเงิน (CouponSelectBox)
// ซ้าย = ต้นขั้วบอกมูลค่าส่วนลดตัวใหญ่ (10% · ฿50 · ส่งฟรี) · รอยปรุ + รูเว้าสองข้าง · ขวา = ชื่อ เงื่อนไข และ children (ปุ่ม/รหัส)
// muted = ใช้แล้ว/หมดอายุ/ใช้กับออเดอร์นี้ไม่ได้ → โทนเทา
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Truck } from "lucide-react";
import type { DiscountType } from "@/services/shopLoyalty";
import { baht } from "./shopStyles";

const DAY = 24 * 60 * 60 * 1000;

/** เหลือกี่วันก่อนหมดอายุ (นับวันตามปฏิทิน) — null = ยังไกล (> 7 วัน) หรือหมดแล้ว */
export function daysLeft(expiresAt: string, now = Date.now()): number | null {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / DAY);
  return d <= 7 ? d : null;
}

export interface CouponTicketData {
  promotion_name: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount: number | null;
}

/** มูลค่าส่วนลดตัวใหญ่บนต้นขั้ว */
function Stub({ c, muted }: { c: CouponTicketData; muted: boolean }) {
  const t = useTranslations("shop.coupons");
  const big =
    c.discount_type === "Percentage" ? `${c.discount_value}%` : c.discount_type === "Amount" ? baht(c.discount_value) : null;
  return (
    <div
      className={`flex w-[88px] shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-4 text-center sm:w-[104px] ${
        muted ? "bg-stone-100 text-stone-400" : "bg-gradient-to-br from-[#4A342E] to-[#8C5A3C] text-white"
      }`}
    >
      {big ? (
        <>
          <span className="text-xl font-black leading-none sm:text-2xl">{big}</span>
          <span className={`text-[11px] font-semibold ${muted ? "" : "text-amber-200"}`}>{t("off")}</span>
        </>
      ) : (
        <>
          <Truck className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-black leading-tight">{t("freeShipping")}</span>
        </>
      )}
      {c.discount_type === "Percentage" && c.max_discount_amount ? (
        <span className={`text-[10px] leading-tight ${muted ? "" : "text-white/80"}`}>{t("upTo", { max: baht(c.max_discount_amount) })}</span>
      ) : null}
    </div>
  );
}

export default function CouponTicket({
  coupon,
  muted = false,
  selected = false,
  badge,
  meta,
  children,
  className = "",
  surface = "page",
}: {
  coupon: CouponTicketData;
  muted?: boolean;
  /** กรอบเน้นเมื่อเลือกอยู่ (หน้าชำระเงิน) */
  selected?: boolean;
  /** ป้ายมุมขวาบน (สถานะ · คุ้มที่สุด · ใกล้หมดอายุ) */
  badge?: ReactNode;
  /** บรรทัดเงื่อนไขใต้ชื่อ (ขั้นต่ำ · วันหมดอายุ) */
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** สีพื้นที่ตั๋ววางอยู่ — รูเว้าใช้สีเดียวกันให้ดูเป็นรอยเจาะ (page = พื้นหน้าร้าน · card = ในการ์ดขาว) */
  surface?: "page" | "card";
}) {
  const notch = `absolute -left-[9px] h-4 w-4 rounded-full border border-stone-200 ${surface === "card" ? "bg-white" : "bg-slate-50"}`;
  return (
    <div
      className={`relative flex overflow-hidden rounded-2xl border bg-white transition ${
        selected
          ? "border-[#8C5A3C] shadow-md ring-2 ring-[#8C5A3C]/25"
          : muted
            ? "border-stone-200"
            : "border-[#8C5A3C]/15 shadow-sm"
      } ${className}`}
    >
      <Stub c={coupon} muted={muted} />
      {/* รอยปรุ + รูเว้าบน/ล่าง ระหว่างต้นขั้วกับเนื้อคูปอง */}
      <div className="relative w-0 border-l-2 border-dashed border-stone-200" aria-hidden="true">
        <span className={`${notch} -top-2`} />
        <span className={`${notch} -bottom-2`} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <p className={`m-0 min-w-0 text-sm font-bold leading-snug ${muted ? "text-stone-500" : "text-stone-800"}`}>{coupon.promotion_name}</p>
          {badge}
        </div>
        {meta && <div className="text-xs text-stone-500">{meta}</div>}
        {children}
      </div>
    </div>
  );
}
