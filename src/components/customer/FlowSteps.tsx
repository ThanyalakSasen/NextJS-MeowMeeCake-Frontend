"use client";
// แถบขั้นตอนการสั่งซื้อของลูกค้า (BACKLOG4 U8 · ตาม FrontOffice FlowSteps)
// ออเดอร์: ตะกร้า → ยืนยันคำสั่งซื้อ → ชำระเงิน / แนบสลิป → สั่งซื้อสำเร็จ
// พรีออเดอร์: เลือกสินค้าในรอบ → ยืนยันพรีออเดอร์ → ชำระเงิน / แนบสลิป → สั่งซื้อสำเร็จ
// current เริ่มที่ 1 — ขั้นที่ผ่านแล้ว ✓ สีเขียว · ขั้นปัจจุบันสีน้ำตาลเข้ม · ขั้นถัดไปสีเทา
// แถวเดียวเสมอ · ข้อความแต่ละขั้นบรรทัดเดียว (ไม่ตัดคำ)
//   จอมือถือ (<640): วงกลมอยู่บน ข้อความอยู่ใต้วงกลม (ประหยัดความกว้าง) · เส้นเชื่อมอยู่ระดับกลางวงกลม
//   จอ ≥640: วงกลม + ข้อความเรียงข้างกัน
//   ที่ไม่พอ = เส้นเชื่อมหด (flex-1 · ยาวสุด 32px · สั้นสุด 12px ยังมองเห็น)
import { Fragment } from "react";
import { useTranslations } from "next-intl";

export type FlowKind = "order" | "preorder";

export default function FlowSteps({ kind, current }: { kind: FlowKind; current: 1 | 2 | 3 | 4 }) {
  const t = useTranslations("shop.flow");
  const steps = [kind === "order" ? t("cart") : t("pickItems"), kind === "order" ? t("confirm") : t("confirmPreorder"), t("pay"), t("done")];

  return (
    <ol
      className="m-0 mx-auto flex w-full max-w-3xl list-none flex-nowrap items-start justify-center gap-1 p-0 text-[11px] font-semibold sm:items-center sm:gap-3 sm:text-xs"
      aria-label={t("aria")}
    >
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <Fragment key={label}>
            <li className="flex shrink-0 flex-col items-center gap-1 sm:flex-row sm:gap-1.5" aria-current={active ? "step" : undefined}>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                  done ? "bg-emerald-600 text-white" : active ? "bg-[#4A342E] text-white" : "bg-stone-200 text-stone-500"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={`whitespace-nowrap leading-tight ${active ? "text-[#4A342E]" : done ? "text-emerald-700" : "text-stone-500"}`}>
                {label}
              </span>
            </li>
            {n < steps.length && (
              // mt-3 = ครึ่งความสูงวงกลม (h-6) → เส้นอยู่ระดับกลางวงกลมบนมือถือ
              <li className="mt-3 h-px min-w-3 max-w-8 flex-1 bg-stone-300 sm:mt-0" aria-hidden="true" role="presentation" />
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}
