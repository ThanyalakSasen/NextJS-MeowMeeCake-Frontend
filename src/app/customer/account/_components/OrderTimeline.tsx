"use client";
// ไทม์ไลน์สถานะออเดอร์ในหน้ารายละเอียด (BACKLOG4 U7)
// 4 ขั้น (ผู้ใช้เลือก 2026-10-27): สั่งซื้อแล้ว → ชำระเงินแล้ว → กำลังเตรียมสินค้า → ส่งสินค้าแล้ว
// ready (พร้อมส่ง/พร้อมรับ) นับเป็น "กำลังเตรียมสินค้า" · จัดส่งถึงแล้ว (delivered) = ส่งสินค้าแล้ว
// backend ไม่ส่งเวลาของแต่ละสถานะ → แสดงแค่ถึงขั้นไหนแล้ว · ยกเลิกแล้วไม่แสดง (หน้ามีแถบเหตุผลยกเลิกอยู่แล้ว)
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ShopOrder } from "@/services/shopOrders";

const STEP_OF_STATUS = { pending: 0, confirmed: 1, preparing: 2, ready: 2, completed: 3, cancelled: -1 } as const;

/** ขั้นสุดท้ายที่ผ่านแล้ว (0 = สั่งซื้อแล้ว · 3 = ส่งสินค้าแล้ว) */
export function orderTimelineStep(o: Pick<ShopOrder, "order_status" | "payment_status" | "order_type" | "delivery_status">): number {
  let step: number = STEP_OF_STATUS[o.order_status];
  if (step === 0 && o.payment_status === "paid") step = 1;
  if (o.order_type === "delivery" && o.delivery_status === "delivered") step = 3;
  return step;
}

/** ใช้ทั้งออเดอร์และพรีออเดอร์ (ฟิลด์สถานะชุดเดียวกัน) */
export default function OrderTimeline({ order }: { order: Pick<ShopOrder, "order_status" | "payment_status" | "order_type" | "delivery_status"> }) {
  const t = useTranslations("shop.orders.timeline");
  if (order.order_status === "cancelled") return null;
  const labels = [t("placed"), t("paid"), t("preparing"), t("delivered")];
  const done = orderTimelineStep(order);

  return (
    <ol className="flex items-start" aria-label={t("aria")}>
      {labels.map((label, i) => {
        const passed = i <= done;
        const current = i === done + 1;
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center gap-1.5 text-center" aria-current={current ? "step" : undefined}>
            {i > 0 && (
              <span className={`absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2 ${passed ? "bg-emerald-500" : "bg-stone-200"}`} aria-hidden="true" />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                passed
                  ? "bg-emerald-500 text-white"
                  : current
                    ? "border-2 border-amber-400 bg-amber-50 text-amber-600"
                    : "border border-stone-200 bg-white text-stone-500"
              }`}
            >
              {passed ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={`px-0.5 text-[11px] leading-tight sm:text-xs ${passed ? "font-semibold text-stone-800" : current ? "font-semibold text-amber-700" : "text-stone-500"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
