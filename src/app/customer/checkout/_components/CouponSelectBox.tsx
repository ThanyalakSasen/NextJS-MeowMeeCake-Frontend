"use client";
// ─────────────────────────────────────────────────────────────
// คูปองของฉัน (แลกด้วยแต้ม) — แทน FrontOffice CouponSelectBox
// เลือกได้ใบเดียว · ใช้คู่กับโค้ดส่วนลดไม่ได้ (หน้า checkout ล้างอีกฝั่งให้) · ส่วนลดที่แสดงเป็นยอดประมาณจาก couponDiscount()
// ─────────────────────────────────────────────────────────────
import { couponDiscount, type CouponUnusableReason, type MyCoupon } from "@/services/shopLoyalty";
import { baht } from "@/components/customer/shopStyles";

const expiryText = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

function couponLabel(c: Pick<MyCoupon, "discount_type" | "discount_value" | "max_discount_amount">): string {
  if (c.discount_type === "Percentage") {
    return `ลด ${c.discount_value}%${c.max_discount_amount ? ` (สูงสุด ${baht(c.max_discount_amount)})` : ""}`;
  }
  if (c.discount_type === "Amount") return `ลด ${baht(c.discount_value)}`;
  return "ส่งฟรี";
}

function reasonText(reason: CouponUnusableReason, c: MyCoupon): string {
  if (reason === "min_order") return `ยอดสินค้ายังไม่ถึงขั้นต่ำ ${baht(c.min_order_amount)}`;
  if (reason === "needs_delivery_fee") return "ใช้ได้เมื่อเลือกจัดส่งที่มีค่าจัดส่ง";
  return "ไม่ได้ส่วนลดกับออเดอร์นี้";
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
  if (coupons.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">คูปองของฉัน</p>
      <div className="max-h-64 space-y-2 overflow-y-auto" role="radiogroup" aria-label="คูปองของฉัน">
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
                <span className="font-bold">{couponLabel(c)}</span>
                {result.amount !== null && <span className="shrink-0 font-semibold text-green-700">-{baht(result.amount)}</span>}
              </div>
              <p className="text-xs text-gray-600">{c.promotion_name}</p>
              <p className="text-xs text-gray-500">
                {c.min_order_amount > 0 && `ขั้นต่ำ ${baht(c.min_order_amount)} · `}ใช้ได้ถึง {expiryText(c.expires_at)}
              </p>
              {result.reason && (
                <p className="text-xs text-amber-700">
                  {reasonText(result.reason, c)}
                  {active && " — จะไม่ถูกใช้กับออเดอร์นี้"}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
