"use client";
// ─────────────────────────────────────────────────────────────
// ชิ้นส่วนหน้าพรีออเดอร์ — ยกจาก FrontOffice preorder/_components (shared.tsx · PreorderSteps.tsx)
// ข้อความกติกาตาม backend หลัก (preorderService): ชำระภายใน 24 ชม. (ไม่เกินปิดรอบ) · ยกเลิกเองได้ก่อนชำระ
// (ต้นแบบเขียน 30 นาที + ยกเลิกหลังชำระได้ — เป็นกติกาของ backend พอร์ต 4000 เดิม)
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import type { StorefrontRoundItem } from "@/services/shopPreorders";
import { roundItemLimits } from "@/services/shopPreorders";
import { resolveUploadUrl } from "@/lib/uploads";
import { baht } from "@/components/customer/shopStyles";
import { usePreorderBasket } from "../lib/preorderBasket";

const STEPS: { title: string; detail: string; important?: boolean }[] = [
  { title: "เลือกรอบที่กำลังเปิดรับ", detail: "แต่ละรอบมีวันปิดรับและวันรับสินค้ากำกับไว้ — ปิดรอบแล้วสั่งเพิ่มไม่ได้" },
  { title: "เลือกสินค้าและจำนวน", detail: "สินค้าในรอบมีจำนวนจำกัด บางรายการมีขั้นต่ำ และจำกัดจำนวนต่อคนต่อรอบ" },
  { title: "ยืนยันคำสั่งซื้อ", detail: "รับเองที่จุดรับ (เลือกวันรับได้) หรือจัดส่งตามที่อยู่ · ใช้คูปองหรือแต้มสะสมเป็นส่วนลดได้" },
  { title: "ชำระเงินภายใน 24 ชั่วโมง", detail: "สแกน QR แล้วแนบสลิปในหน้าคำสั่งซื้อ — ไม่ชำระภายในเวลา (และไม่เกินวันปิดรอบ) ระบบยกเลิกให้อัตโนมัติ", important: true },
  { title: "ร้านยืนยันและเริ่มผลิต", detail: "ติดตามสถานะได้ที่ “ประวัติพรีออเดอร์” ในบัญชีของฉัน" },
  { title: "รับสินค้าตามวันที่เลือก", detail: "ยกเลิกเองได้เฉพาะก่อนชำระเงิน — ชำระแล้วต้องการยกเลิกกรุณาติดต่อร้าน" },
];

export function PreorderSteps() {
  return (
    <section className="rounded-2xl border border-[#8C5A3C]/10 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="preorder-steps">
      <h2 id="preorder-steps" className="m-0 mb-4 text-lg font-bold text-[#4A342E]">ขั้นตอนการสั่งพรีออเดอร์</h2>
      <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className={`flex gap-3 rounded-xl border p-3 ${s.important ? "border-amber-200 bg-amber-50/60" : "border-stone-100 bg-stone-50/60"}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${s.important ? "bg-amber-600" : "bg-[#8C5A3C]"}`}>{i + 1}</span>
            <div>
              <p className="m-0 text-sm font-bold text-[#4A342E]">{s.title}</p>
              <p className="m-0 text-xs text-stone-600">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
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
  const c = useCountdown(target);
  if (c.done) return null;
  return (
    <span>
      {prefix} {c.days > 0 && `${c.days} วัน `}
      {c.hours} ชม. {c.minutes} นาที
    </span>
  );
}

/** บัตรสินค้าในรอบ → หน้าสินค้า (โหมดพรีออเดอร์ ?round=) */
export function RoundProductCard({ item, roundId }: { item: StorefrontRoundItem; roundId: string }) {
  const p = item.product;
  const { min, max } = roundItemLimits(item);
  const soldOut = item.remaining_qty <= 0 || max < min;
  const img = resolveUploadUrl(p.product_img[0]);
  const regular = p.sale_price != null && p.sale_price < p.product_price ? p.sale_price : p.product_price;
  return (
    <Link href={`/customer/product/${p._id}?round=${roundId}`} className="group block h-full">
      <div className={`flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md ${soldOut ? "opacity-75" : ""}`}>
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={p.product_name_th} className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${soldOut ? "grayscale" : ""}`} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">ไม่มีรูปภาพ</div>
          )}
          <span
            className={`absolute right-2 top-2 rounded border px-2 py-0.5 text-[10px] font-semibold ${
              soldOut ? "border-red-200 bg-red-50 text-red-600" : item.remaining_qty <= Math.max(3, item.max_qty_total * 0.2) ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {soldOut ? "เต็มแล้ว" : item.remaining_qty <= Math.max(3, item.max_qty_total * 0.2) ? "ใกล้เต็ม" : "เปิดรับ"}
          </span>
        </div>
        <div className="flex flex-grow flex-col justify-between p-4">
          <div>
            <h3 className="m-0 line-clamp-1 text-sm font-bold text-stone-800 group-hover:text-[#4A342E]">{p.product_name_th}</h3>
            <p className="m-0 mb-3 line-clamp-1 text-xs text-stone-400">{p.product_name_eng}</p>
          </div>
          <div>
            <p className="m-0 mb-1 flex items-baseline gap-1.5">
              <span className={`text-sm font-bold ${item.current_price < regular ? "text-red-600" : "text-[#4A342E]"}`}>{baht(item.current_price)}</span>
              {item.current_price < regular && <span className="text-[11px] text-stone-400 line-through">{baht(regular)}</span>}
            </p>
            <p className={`m-0 text-[11px] ${soldOut ? "font-semibold text-red-500" : "text-stone-500"}`}>
              {soldOut ? "สินค้าเต็มแล้ว" : `เหลือ ${item.remaining_qty.toLocaleString("th-TH")} ชิ้น${min > 1 ? ` · ขั้นต่ำ ${min}` : ""}`}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** แถบ "รายการพรีออเดอร์" ค้างอยู่ → ไปหน้ายืนยัน */
export function BasketBar() {
  const basket = usePreorderBasket();
  if (!basket) return null;
  const qty = basket.items.reduce((s, it) => s + it.quantity, 0);
  const total = basket.items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#8C5A3C]/30 bg-[#FAF6F0] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="m-0 flex items-center gap-2 text-sm text-[#4A342E]">
        <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          รายการพรีออเดอร์ <strong>{basket.round_name}</strong> · {qty.toLocaleString("th-TH")} ชิ้น · {baht(total)}
        </span>
      </p>
      <Link href="/customer/preorder/checkout" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4A342E] px-4 py-2 text-sm font-bold text-white hover:bg-[#8C5A3C]">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> ไปยืนยันพรีออเดอร์
      </Link>
    </div>
  );
}
