"use client";
// ─────────────────────────────────────────────────────────────
// ชิ้นส่วนหน้าพรีออเดอร์ — ยกจาก FrontOffice preorder/_components (shared.tsx · PreorderSteps.tsx)
// ข้อความกติกาตาม backend หลัก (preorderService): ชำระภายใน 24 ชม. (ไม่เกินปิดรอบ) · ยกเลิกเองได้ก่อนชำระ
// (ต้นแบบเขียน 30 นาที + ยกเลิกหลังชำระได้ — เป็นกติกาของ backend พอร์ต 4000 เดิม)
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import Link from "next/link";
import { CheckCircle2, ListChecks, ShoppingBag } from "lucide-react";
import type { StorefrontRoundItem } from "@/services/shopPreorders";
import { roundItemLimits } from "@/services/shopPreorders";
import { resolveUploadUrl } from "@/lib/uploads";
import {
  baht,
  productCardBody,
  productCardButton,
  productCardFrame,
  productCardImage,
  productCardSubtitle,
  productCardTitle,
  shopButton,
  shopButtonPrimary,
} from "@/components/customer/shopStyles";
import ShopModal from "@/components/customer/ShopModal";
import { usePreorderBasket } from "../lib/preorderBasket";
import ShopImage from "@/components/customer/ShopImage";
import { AllergenBadge, LocalOnlyBadge } from "@/components/customer/ProductCard";
import { useAllergenWarnings } from "@/app/customer/hooks/useAllergenWarnings";

const STEPS = [
  { title: "s1", detail: "d1" },
  { title: "s2", detail: "d2" },
  { title: "s3", detail: "d3" },
  { title: "s4", detail: "d4", important: true },
  { title: "s5", detail: "d5" },
  { title: "s6", detail: "d6" },
] as const;

/**
 * ขั้นตอนการสั่งพรีออเดอร์ — ปุ่มข้างหัวข้อหน้า กดแล้วขึ้นป๊อปอัพ (เดิมเป็นกล่องใหญ่ท้ายหน้า ต้องเลื่อนลงไปหา)
 */
export function PreorderStepsButton({ className = "" }: { className?: string }) {
  const t = useTranslations("shop.preorderShop.steps");
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={`${shopButton} shrink-0 ${className}`}>
        <ListChecks className="h-4 w-4" aria-hidden="true" />
        {t("button")}
      </button>
      <ShopModal
        open={open}
        onClose={close}
        title={t("title")}
        footer={
          <button type="button" onClick={close} className={`${shopButtonPrimary} w-full`}>
            {t("gotIt")}
          </button>
        }
      >
        <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className={`flex gap-3 rounded-xl border p-3 ${"important" in s ? "border-amber-200 bg-amber-50/60" : "border-stone-100 bg-stone-50/60"}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${"important" in s ? "bg-amber-600" : "bg-[#8C5A3C]"}`}>{i + 1}</span>
              <div>
                <p className="m-0 text-sm font-bold text-[#4A342E]">{t(s.title)}</p>
                <p className="m-0 text-xs text-stone-600">{t(s.detail)}</p>
              </div>
            </li>
          ))}
        </ol>
      </ShopModal>
    </>
  );
}

/** นับถอยหลังถึงเวลาที่กำหนด (ปิดรับ / เปิดรับ) — อัปเดตทุกนาที */
export function useCountdown(targetIso: string): { days: number; hours: number; minutes: number; done: boolean } {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(targetIso).getTime() - now);
  return { days: Math.floor(ms / 86_400_000), hours: Math.floor((ms % 86_400_000) / 3_600_000), minutes: Math.floor((ms % 3_600_000) / 60_000), done: ms === 0 };
}

export function CountdownText({ target, prefix }: { target: string; prefix: string }) {
  const t = useTranslations("shop.preorderShop");
  const c = useCountdown(target);
  if (c.done) return null;
  return (
    <span>
      {prefix} {c.days > 0 && t("days", { n: c.days })}
      {t("hoursMins", { h: c.hours, m: c.minutes })}
    </span>
  );
}

/** บัตรสินค้าในรอบ → หน้าสินค้า (โหมดพรีออเดอร์ ?round=) · โครงเดียวกับ ProductCard (shopStyles) — ขนาด/หน้าตาเท่ากันทุกหน้า */
export function RoundProductCard({ item, roundId }: { item: StorefrontRoundItem; roundId: string }) {
  const t = useTranslations("shop.preorderShop");
  const { names: localNames } = useLocalName();
  const allergenWarningOf = useAllergenWarnings();
  const p = item.product;
  const { min, max } = roundItemLimits(item);
  const soldOut = item.remaining_qty <= 0 || max < min;
  const almostFull = !soldOut && item.remaining_qty <= Math.max(3, item.max_qty_total * 0.2);
  const img = resolveUploadUrl(p.product_img[0]);
  const regular = p.sale_price != null && p.sale_price < p.product_price ? p.sale_price : p.product_price;
  const names = localNames(p.product_name_th, p.product_name_eng);
  return (
    <Link href={`/customer/product/${p._id}?round=${roundId}`} className={`${productCardFrame} ${soldOut ? "opacity-75" : ""}`}>
      <div className={productCardImage}>
        {img ? (
          <ShopImage
            src={img}
            alt={p.product_name_th}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${soldOut ? "grayscale" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-stone-500">{t("noImage")}</div>
        )}
        <AllergenBadge warning={allergenWarningOf(p._id)} />
        <LocalOnlyBadge productId={p._id} category={p.category_id} />
        <span
          className={`absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            soldOut ? "border-red-200 bg-red-50 text-red-600" : almostFull ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {soldOut ? t("full") : almostFull ? t("almostFull") : t("open")}
        </span>
      </div>
      <div className={productCardBody}>
        <div className="min-w-0">
          <h3 className={productCardTitle}>{names.primary}</h3>
          <p className={productCardSubtitle}>{names.secondary || " "}</p>
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex items-end justify-between gap-2">
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
              <span className={`text-sm font-extrabold md:text-[0.9444rem] xl:text-base ${item.current_price < regular ? "text-red-600" : "text-[#8C5A3C]"}`}>{baht(item.current_price)}</span>
              {item.current_price < regular && <span className="text-xs text-stone-500 line-through">{baht(regular)}</span>}
            </span>
            <span className={`shrink-0 pb-0.5 text-xs ${soldOut ? "font-semibold text-red-600" : "text-stone-500"}`}>
              {soldOut ? t("soldOut") : min > 1 ? t("leftMin", { n: item.remaining_qty.toLocaleString(), min }) : t("left", { n: item.remaining_qty.toLocaleString() })}
            </span>
          </div>
          {/* ปุ่มหลอก (ทั้งบัตรเป็นลิงก์) — ให้บัตรพรีออเดอร์สูงเท่าบัตรสินค้าปกติที่มีปุ่มเพิ่มลงตะกร้า */}
          <span className={`${productCardButton} ${soldOut ? "pointer-events-none opacity-60" : ""}`}>{soldOut ? t("soldOut") : t("choose")}</span>
        </div>
      </div>
    </Link>
  );
}

/** แถบ "รายการพรีออเดอร์" ค้างอยู่ → ไปหน้ายืนยัน */
export function BasketBar() {
  const t = useTranslations("shop.preorderShop");
  const basket = usePreorderBasket();
  if (!basket) return null;
  const qty = basket.items.reduce((s, it) => s + it.quantity, 0);
  const total = basket.items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#8C5A3C]/30 bg-[#FAF6F0] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="m-0 flex items-center gap-2 text-sm text-[#4A342E]">
        <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          {t.rich("basket", { round: basket.round_name, n: qty.toLocaleString(), amount: baht(total), b: (c) => <strong>{c}</strong> })}
        </span>
      </p>
      <Link href="/customer/preorder/checkout" className="inline-flex h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#4A342E] px-4 text-sm font-bold text-white hover:bg-[#8C5A3C]">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t("goConfirm")}
      </Link>
    </div>
  );
}
