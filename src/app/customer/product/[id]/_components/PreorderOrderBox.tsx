"use client";
// ─────────────────────────────────────────────────────────────
// สั่งพรีออเดอร์จากหน้าสินค้า (D3) — ยกจาก FrontOffice ProductDetailClient (โหมดรอบพรีออเดอร์)
// เปิดจากหน้ารอบ (?round=) → ราคา/โควตาของรอบ · เลือกตัวเลือก (ตัวเดียวกับสินค้าปกติ) · จำนวน (ขั้นต่ำ/สูงสุดของรอบ+สินค้า)
// · หมายเหตุ (special_request — พรีออเดอร์มีช่องนี้ ตะกร้าปกติไม่มี) → เพิ่มลงรายการพรีออเดอร์ (localStorage) หรือไปยืนยันเลย
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { roundItemLimits, type StorefrontRoundDetail, type StorefrontRoundItem } from "@/services/shopPreorders";
import type { ProductCustomization } from "@/types/productCustomization";
import type { CartSelection, Picked, PickProblem } from "@/lib/customizationSelection";
import { alert, confirmAlert } from "@/lib/alert";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { LOGIN_PATH } from "@/constants/auth";
import { baht } from "@/components/customer/shopStyles";
import { addToPreorderBasket } from "../../../preorder/lib/preorderBasket";
import { thaiDate } from "../../../preorder/lib/preorderDates";
import { isRoundOpen, useNow } from "../../../preorder/lib/useNow";
import { pickProblemText } from "../../../lib/pickProblemText";
import CustomizationPicker from "./CustomizationPicker";

const btn =
  "h-11 rounded-xl px-3 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 sm:text-base";

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
  const router = useRouter();
  const { status } = useCustomerSession();
  const [qty, setQty] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showProblems, setShowProblems] = useState(false);
  const now = useNow();

  if (!hasRoundParam || (!loading && (!round || !roundItem))) {
    return (
      <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="m-0 font-medium">
          {hasRoundParam ? "สินค้านี้ไม่ได้เปิดขายในรอบที่เลือก" : "สินค้านี้เป็นสินค้าพรีออเดอร์ สั่งได้ผ่านรอบพรีออเดอร์เท่านั้น"}
        </p>
        <Link href="/customer/preorder" className="font-bold underline">ดูรอบพรีออเดอร์ที่เปิดรับ →</Link>
      </div>
    );
  }
  if (loading || !round || !roundItem) return <p className="animate-pulse text-xs text-gray-500">กำลังโหลดข้อมูลรอบพรีออเดอร์...</p>;

  const isOpen = isRoundOpen(round, now);
  const { min, max } = roundItemLimits(roundItem);
  const soldOut = max < min;
  const quantity = Math.min(Math.max(qty ?? min, min), Math.max(min, max));
  const unit = roundItem.current_price + (selection?.extra ?? 0);
  const disabled = !isOpen || soldOut;

  const add = (goCheckout: boolean) => {
    if (status !== "authenticated") {
      alert.warning("กรุณาเข้าสู่ระบบก่อนสั่งพรีออเดอร์");
      router.push(`${LOGIN_PATH}?next=${encodeURIComponent(`/customer/product/${productId}?round=${round._id}`)}`);
      return;
    }
    if (problems.length > 0) {
      setShowProblems(true);
      alert.warning(pickProblemText(problems[0]));
      return;
    }
    const item = {
      round_item_id: roundItem._id,
      product_id: productId,
      product_name_th: productName,
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
    const meta = { round_id: round._id, round_name: round.round_name, pickup_date: round.pickup_date };
    const done = () => {
      setShowProblems(false);
      if (goCheckout) router.push("/customer/preorder/checkout");
      else alert.success("เพิ่มลงรายการพรีออเดอร์แล้ว");
    };
    const res = addToPreorderBasket(meta, item);
    if (res.ok) return done();
    void confirmAlert(`รายการพรีออเดอร์มีสินค้าของ "${res.conflictRoundName}" อยู่ — 1 คำสั่งซื้อสั่งได้รอบเดียว ล้างรายการเดิมแล้วเริ่มรอบนี้ไหม?`, {
      title: "เปลี่ยนรอบพรีออเดอร์",
      confirmText: "ล้างแล้วเพิ่ม",
      cancelText: "ไม่เปลี่ยน",
    }).then((ok) => {
      if (ok && addToPreorderBasket(meta, item, { replace: true }).ok) done();
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#8C5A3C]/15 bg-white p-4 text-sm">
        <p className="m-0 font-bold text-[#4A342E]">
          รอบ: <Link href={`/customer/preorder/${round._id}`} className="underline">{round.round_name}</Link>
        </p>
        <p className="m-0 text-gray-600">
          {isOpen ? `ปิดรับ ${thaiDate(round.close_date, true)}` : "ปิดรับแล้ว / ยังไม่เปิดรับ"} · รับสินค้าตั้งแต่ {thaiDate(round.pickup_date)}
        </p>
        <p className="m-0 text-gray-600">
          ราคาในรอบ <span className="font-bold text-[#8C5A3C]">{baht(roundItem.current_price)}</span> · เหลือ {roundItem.remaining_qty.toLocaleString("th-TH")} ชิ้น
          {min > 1 && ` · ขั้นต่ำ ${min} ชิ้น`}
          {roundItem.product.preorder_config?.max_order_qty != null && ` · สูงสุด ${roundItem.product.preorder_config.max_order_qty} ชิ้นต่อคน`}
        </p>
      </div>

      {customization && <CustomizationPicker customization={customization} picked={picked} onChange={onPick} disabled={disabled} />}
      {showProblems && problems.length > 0 && (
        <ul className="m-0 list-none space-y-0.5 p-0 text-xs text-red-600" role="alert">
          {problems.map((p) => (
            <li key={`${p.key}-${JSON.stringify(p.params)}`}>{pickProblemText(p)}</li>
          ))}
        </ul>
      )}

      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-[#4A342E]">หมายเหตุถึงร้าน (ไม่บังคับ)</span>
        <input
          type="text"
          maxLength={500}
          value={note}
          disabled={disabled}
          placeholder="เช่น หวานน้อย"
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border border-[#8C5A3C]/20 bg-white px-4 py-2.5 text-xs text-[#4A342E] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8C5A3C]/40 sm:text-sm"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-[#8C5A3C]/30 bg-white">
          <button type="button" onClick={() => setQty(quantity - 1)} disabled={disabled || quantity <= min} aria-label="ลดจำนวน"
            className="flex h-11 w-10 items-center justify-center text-lg font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40">-</button>
          <span className="w-12 text-center text-sm font-bold text-[#4A342E] sm:text-base">{quantity}</span>
          <button type="button" onClick={() => setQty(quantity + 1)} disabled={disabled || quantity >= max} aria-label="เพิ่มจำนวน"
            className="flex h-11 w-10 items-center justify-center text-lg font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40">+</button>
        </div>
        <button type="button" disabled={disabled} onClick={() => add(false)}
          className={`${btn} flex-1 border border-[#8C5A3C]/30 bg-white text-[#4A342E] shadow-md shadow-[#4A342E]/20 hover:bg-[#4A342E] hover:text-white`}>
          เพิ่มลงรายการพรีออเดอร์
        </button>
        <button type="button" disabled={disabled} onClick={() => add(true)}
          className={`${btn} w-full bg-[#4A342E] text-white shadow-md hover:bg-[#8C5A3C] sm:w-auto sm:flex-1`}>
          {soldOut ? "สินค้าเต็มแล้ว" : !isOpen ? "รอบนี้ไม่เปิดรับ" : `พรีออเดอร์เลย · ${baht(unit * quantity)}`}
        </button>
      </div>
    </div>
  );
}
