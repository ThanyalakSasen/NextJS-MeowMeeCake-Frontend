"use client";
// แถบขั้นตอนการสั่งซื้อของลูกค้า (BACKLOG4 U8 · ตาม FrontOffice FlowSteps)
// ออเดอร์: ตะกร้า → ยืนยันคำสั่งซื้อ → ชำระเงิน / แนบสลิป → สั่งซื้อสำเร็จ
// พรีออเดอร์: เลือกสินค้าในรอบ → ยืนยันพรีออเดอร์ → ชำระเงิน / แนบสลิป → สั่งซื้อสำเร็จ
// current เริ่มที่ 1 — ขั้นที่ผ่านแล้ว ✓ สีเขียว · ขั้นปัจจุบันสีน้ำตาลเข้ม · ขั้นถัดไปสีเทา
import { useTranslations } from "next-intl";

export type FlowKind = "order" | "preorder";

export default function FlowSteps({ kind, current }: { kind: FlowKind; current: 1 | 2 | 3 | 4 }) {
  const t = useTranslations("shop.flow");
  const steps = [kind === "order" ? t("cart") : t("pickItems"), kind === "order" ? t("confirm") : t("confirmPreorder"), t("pay"), t("done")];

  return (
    <ol className="m-0 flex list-none flex-wrap items-center justify-center gap-2 p-0 text-[11px] font-semibold sm:gap-3 sm:text-xs" aria-label={t("aria")}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3" aria-current={active ? "step" : undefined}>
            <span className="flex items-center gap-1.5">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                  done ? "bg-emerald-600 text-white" : active ? "bg-[#4A342E] text-white" : "bg-stone-200 text-stone-500"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={active ? "text-[#4A342E]" : done ? "text-emerald-700" : "text-stone-500"}>{label}</span>
            </span>
            {n < steps.length && <span className="h-px w-4 bg-stone-300 sm:w-8" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
