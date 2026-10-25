"use client";
// ─────────────────────────────────────────────────────────────
// ชิ้นส่วนหน้าพรีออเดอร์ — ยกจาก FrontOffice preorder/_components (shared.tsx · PreorderSteps.tsx)
// ข้อความกติกาตาม backend หลัก (preorderService): ชำระภายใน 24 ชม. (ไม่เกินปิดรอบ) · ยกเลิกเองได้ก่อนชำระ
// (ต้นแบบเขียน 30 นาที + ยกเลิกหลังชำระได้ — เป็นกติกาของ backend พอร์ต 4000 เดิม)
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import Link from "next/link";
import { CheckCircle2, ListOrdered, ShoppingBag, X } from "lucide-react";
import type { StorefrontRoundItem } from "@/services/shopPreorders";
import { roundItemLimits } from "@/services/shopPreorders";
import { resolveUploadUrl } from "@/lib/uploads";
import { baht } from "@/components/customer/shopStyles";
import { usePreorderBasket } from "../lib/preorderBasket";
import ShopImage from "@/components/customer/ShopImage";
import { AllergenBadge } from "@/components/customer/ProductCard";
import { useAllergenWarnings } from "@/app/customer/hooks/useAllergenWarnings";

const STEPS = [
  { title: "s1", detail: "d1" },
  { title: "s2", detail: "d2" },
  { title: "s3", detail: "d3" },
  { title: "s4", detail: "d4", important: true },
  { title: "s5", detail: "d5" },
  { title: "s6", detail: "d6" },
] as const;

/** ขั้นตอนการสั่งพรีออเดอร์ — ปุ่มมุมขวาบนของหน้า · กดแล้วเปิดเป็นป๊อปอัป (Esc / แตะพื้นหลัง / ปุ่ม X = ปิด) */
export function PreorderSteps() {
  const t = useTranslations("shop.preorderShop.steps");
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // ล็อกการเลื่อนหน้าข้างหลังระหว่างเปิดป๊อปอัป
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-[40px] shrink-0 items-center gap-2 rounded-full border border-[#8C5A3C]/30 !bg-white px-4 text-sm font-bold !text-[#4A342E] shadow-sm transition hover:!bg-[#4A342E] hover:!text-white"
      >
        <ListOrdered className="h-4 w-4" aria-hidden="true" />
        {t("show")}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preorder-steps-title"
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="preorder-steps-title" className="m-0 text-lg font-bold text-[#4A342E]">{t("title")}</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
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
          </div>
        </div>
      )}
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

/** บัตรสินค้าในรอบ → หน้าสินค้า (โหมดพรีออเดอร์ ?round=) */
export function RoundProductCard({ item, roundId }: { item: StorefrontRoundItem; roundId: string }) {
  const t = useTranslations("shop.preorderShop");
  const { names: localNames } = useLocalName();
  const allergenWarningOf = useAllergenWarnings();
  const p = item.product;
  const { min, max } = roundItemLimits(item);
  const soldOut = item.remaining_qty <= 0 || max < min;
  const img = resolveUploadUrl(p.product_img[0]);
  const regular = p.sale_price != null && p.sale_price < p.product_price ? p.sale_price : p.product_price;
  return (
    <Link href={`/customer/product/${p._id}?round=${roundId}`} className="group mb-4 block break-inside-avoid">
      <div className={`flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md ${soldOut ? "opacity-75" : ""}`}>
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          {img ? (
            <ShopImage
              src={img}
              alt={p.product_name_th}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${soldOut ? "grayscale" : ""}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-500">{t("noImage")}</div>
          )}
          <AllergenBadge warning={allergenWarningOf(p._id)} />
          <span
            className={`absolute right-2 top-2 rounded border px-2 py-0.5 text-[10px] font-semibold ${
              soldOut ? "border-red-200 bg-red-50 text-red-600" : item.remaining_qty <= Math.max(3, item.max_qty_total * 0.2) ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {soldOut ? t("full") : item.remaining_qty <= Math.max(3, item.max_qty_total * 0.2) ? t("almostFull") : t("open")}
          </span>
        </div>
        <div className="flex flex-col p-4">
          <div>
            <h3 className="m-0 line-clamp-1 text-sm font-bold text-stone-800 group-hover:text-[#4A342E]">{localNames(p.product_name_th, p.product_name_eng).primary}</h3>
            <p className="m-0 mb-3 line-clamp-1 text-xs text-stone-500">{localNames(p.product_name_th, p.product_name_eng).secondary}</p>
          </div>
          <div>
            <p className="m-0 mb-1 flex items-baseline gap-1.5">
              <span className={`text-sm font-bold ${item.current_price < regular ? "text-red-600" : "text-[#4A342E]"}`}>{baht(item.current_price)}</span>
              {item.current_price < regular && <span className="text-[11px] text-stone-500 line-through">{baht(regular)}</span>}
            </p>
            <p className={`m-0 text-[11px] ${soldOut ? "font-semibold text-red-500" : "text-stone-500"}`}>
              {soldOut ? t("soldOut") : min > 1 ? t("leftMin", { n: item.remaining_qty.toLocaleString(), min }) : t("left", { n: item.remaining_qty.toLocaleString() })}
            </p>
          </div>
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
