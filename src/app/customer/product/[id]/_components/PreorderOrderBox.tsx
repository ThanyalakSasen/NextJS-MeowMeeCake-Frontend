"use client";
// ─────────────────────────────────────────────────────────────
// สั่งพรีออเดอร์จากหน้าสินค้า (D3) — ยกจาก FrontOffice ProductDetailClient (โหมดรอบพรีออเดอร์)
// เปิดจากหน้ารอบ (?round=) → ราคา/โควตาของรอบ · เลือกตัวเลือก (ตัวเดียวกับสินค้าปกติ) · จำนวน (ขั้นต่ำ/สูงสุดของรอบ+สินค้า)
// · หมายเหตุ (special_request — พรีออเดอร์มีช่องนี้ ตะกร้าปกติไม่มี) → ใส่รายการพรีออเดอร์ (localStorage) แล้วไปหน้ายืนยัน
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { roundItemLimits, type StorefrontRoundDetail, type StorefrontRoundItem } from "@/services/shopPreorders";
import type { ProductCustomization } from "@/types/productCustomization";
import type { CartSelection, Picked, PickProblem } from "@/lib/customizationSelection";
import { alert } from "@/lib/alert";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { LOGIN_PATH } from "@/constants/auth";
import { baht } from "@/components/customer/shopStyles";
import { addToPreorderBasket } from "../../../preorder/lib/preorderBasket";
import { thaiDate } from "../../../preorder/lib/preorderDates";
import { isRoundOpen, useNow } from "../../../preorder/lib/useNow";
import { pickProblemText } from "../../../lib/pickProblemText";
import CustomizationPicker from "./CustomizationPicker";
import QtyInput from "@/components/customer/QtyInput";

const btn =
  "h-[44px] rounded-xl px-3 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 ";

export default function PreorderOrderBox({
  productId,
  productName,
  productImg,
  hasRoundParam,
  round,
  roundItem,
  loading,
  customization,
  picked,
  onPick,
  problems,
  selection,
}: {
  productId: string;
  productName: string;
  productImg: string;
  hasRoundParam: boolean;
  round: StorefrontRoundDetail | undefined;
  roundItem: StorefrontRoundItem | undefined;
  loading: boolean;
  /** null = สินค้าไม่มีตัวเลือก */
  customization: ProductCustomization | null;
  picked: Picked;
  onPick: (p: Picked) => void;
  problems: PickProblem[];
  selection: CartSelection | null;
}) {
  const t = useTranslations("shop.preorderBox");
  const ts = useTranslations("shop.preorderShop");
  const tpick = useTranslations("shop.pick");
  const tcart = useTranslations("shop.cart");
  const locale = useLocale();
  const router = useRouter();
  const { status } = useCustomerSession();
  const [qty, setQty] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showProblems, setShowProblems] = useState(false);
  // เพิ่มสำเร็จ = ปุ่มขึ้น "เพิ่มแล้ว" ชั่วครู่ (ไม่มีป๊อปอัป — ไอคอนตะกร้าบน Navbar นับเพิ่มให้เห็นเอง)
  const [added, setAdded] = useState(false);
  const now = useNow();

  if (!hasRoundParam || (!loading && (!round || !roundItem))) {
    return (
      <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="m-0 font-medium">
          {hasRoundParam ? t("notInRound") : t("preorderOnly")}
        </p>
        <Link href="/customer/preorder" className="font-bold underline">{t("seeOpenRounds")}</Link>
      </div>
    );
  }
  if (loading || !round || !roundItem) return <p className="animate-pulse text-xs text-gray-500">{t("loadingRound")}</p>;

  const isOpen = isRoundOpen(round, now);
  const { min, max } = roundItemLimits(roundItem);
  const soldOut = max < min;
  const quantity = Math.min(Math.max(qty ?? min, min), Math.max(min, max));
  const unit = roundItem.current_price + (selection?.extra ?? 0);
  const disabled = !isOpen || soldOut;

  // เพิ่มลงตะกร้า (รายการพรีออเดอร์ใน localStorage) แล้วอยู่หน้าเดิม — สั่งพร้อมสินค้าอื่นได้ที่ตะกร้า (ตะกร้ารวม)
  const add = () => {
    if (status !== "authenticated") {
      alert.warning(t("loginFirst"));
      router.push(`${LOGIN_PATH}?next=${encodeURIComponent(`/customer/product/${productId}?round=${round._id}`)}`);
      return;
    }
    if (problems.length > 0) {
      setShowProblems(true);
      alert.warning(pickProblemText(problems[0], tpick));
      return;
    }
    const item = {
      round_item_id: roundItem._id,
      product_id: productId,
      product_name_th: productName,
      product_name_eng: roundItem.product.product_name_eng ?? null,
      product_img: productImg,
      unit_price: unit,
      quantity,
      min_qty: min,
      max_qty: max,
      special_request: note.trim() || null,
      variant_ids: selection?.variantIds ?? [],
      options: (selection?.options ?? []).map((o) => ({ option_id: o.option_id, text_value: o.text_value })),
      option_text:
        [selection?.variantLabel, ...(selection?.options ?? []).map((o) => (o.text_value ? `${o.option_name}: ${o.text_value}` : o.option_name))]
          .filter(Boolean)
          .join(" · ") || null,
    };
    // ตะกร้ารวม: เก็บได้หลายรอบ (ไม่ต้องล้างรอบเดิม) · อยู่หน้าเดิม — ไอคอนตะกร้าบน Navbar นับเพิ่มให้เห็น
    addToPreorderBasket({ round_id: round._id, round_name: round.round_name, pickup_date: round.pickup_date }, item);
    setShowProblems(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#8C5A3C]/15 bg-white p-4 text-sm">
        <p className="m-0 font-bold text-[#4A342E]">
          {t("round")} <Link href={`/customer/preorder/${round._id}`} className="underline">{round.round_name}</Link>
        </p>
        <p className="m-0 text-gray-600">
          {isOpen ? ts("closesAt", { date: thaiDate(round.close_date, true, locale) }) : t("notOpen")} ·{" "}
          {ts("pickupFrom", { date: thaiDate(round.pickup_date, false, locale) })}
        </p>
        <p className="m-0 text-gray-600">
          {t("roundPrice")} <span className="font-bold text-[#8C5A3C]">{baht(roundItem.current_price)}</span>
          {t("left", { n: roundItem.remaining_qty.toLocaleString() })}
          {min > 1 && t("min", { n: min })}
          {roundItem.product.preorder_config?.max_order_qty != null && t("maxPerPerson", { n: roundItem.product.preorder_config.max_order_qty })}
        </p>
      </div>

      {customization && <CustomizationPicker customization={customization} picked={picked} onChange={onPick} disabled={disabled} />}
      {showProblems && problems.length > 0 && (
        <ul className="m-0 list-none space-y-0.5 p-0 text-xs text-red-600" role="alert">
          {problems.map((p) => (
            <li key={`${p.key}-${JSON.stringify(p.params)}`}>{pickProblemText(p, tpick)}</li>
          ))}
        </ul>
      )}

      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-[#4A342E]">{t("note")}</span>
        <input
          type="text"
          maxLength={500}
          value={note}
          disabled={disabled}
          placeholder={t("notePlaceholder")}
          onChange={(e) => setNote(e.target.value)}
          className="h-[40px] w-full rounded-xl border border-[#8C5A3C]/20 bg-white px-4 text-xs text-[#4A342E] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8C5A3C]/40 sm:text-sm"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-[#8C5A3C]/30 bg-white">
          <button type="button" onClick={() => setQty(quantity - 1)} disabled={disabled || quantity <= min} aria-label={tcart("decrease")}
            className="flex h-[34px] w-10 items-center justify-center text-lg font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40">-</button>
          <QtyInput value={quantity} min={min} max={max} onCommit={setQty} disabled={disabled} ariaLabel={tcart("quantity")}
            className="h-[34px] w-12 text-sm font-bold text-[#4A342E] sm:text-base" />
          <button type="button" onClick={() => setQty(quantity + 1)} disabled={disabled || quantity >= max} aria-label={tcart("increase")}
            className="flex h-[34px] w-10 items-center justify-center text-lg font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40">+</button>
        </div>
        <button type="button" disabled={disabled} onClick={add}
          className={`${btn} min-w-[12rem] flex-1 bg-[#4A342E] text-white shadow-md hover:bg-[#8C5A3C]`}>
          {soldOut ? t("full") : !isOpen ? t("roundNotOpen") : added ? t("addedToCart") : t("addToCart", { amount: baht(unit * quantity) })}
        </button>
      </div>
    </div>
  );
}
