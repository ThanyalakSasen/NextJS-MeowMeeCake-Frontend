"use client";
// ไทม์ไลน์สถานะออเดอร์ในหน้ารายละเอียด (BACKLOG4 U7) — ต้นแบบ FrontOffice มี 3 ขั้น (เตรียม → จัดส่ง → สำเร็จ)
// ที่นี่ 5 ขั้นให้เห็นช่วงชำระเงินด้วย · ขั้นที่ 4–5 ตามประเภท (ส่งตามที่อยู่ / รับเอง)
// backend ไม่ส่งเวลาของแต่ละสถานะ → แสดงแค่ถึงขั้นไหนแล้ว · ยกเลิกแล้วไม่แสดง (หน้ามีแถบเหตุผลยกเลิกอยู่แล้ว)
import { Check } from "lucide-react";
import type { ShopOrder } from "@/services/shopOrders";

const STEP_OF_STATUS = { pending: 0, confirmed: 1, preparing: 2, ready: 3, completed: 4, cancelled: -1 } as const;

/** ขั้นสุดท้ายที่ผ่านแล้ว (0 = สั่งซื้อแล้ว · 4 = เสร็จ) */
export function orderTimelineStep(o: Pick<ShopOrder, "order_status" | "payment_status" | "order_type" | "delivery_status">): number {
  let step: number = STEP_OF_STATUS[o.order_status];
  if (step === 0 && o.payment_status === "paid") step = 1;
  if (o.order_type === "delivery" && o.delivery_status === "delivered") step = 4;
  return step;
}

export default function OrderTimeline({ order }: { order: ShopOrder }) {
  if (order.order_status === "cancelled") return null;
  const delivery = order.order_type === "delivery";
  const labels = [
    "สั่งซื้อแล้ว",
    "ชำระเงิน / ร้านยืนยัน",
    "กำลังเตรียมสินค้า",
    delivery ? "กำลังจัดส่ง" : "พร้อมรับสินค้า",
    delivery ? "ได้รับสินค้าแล้ว" : "รับสินค้าแล้ว",
  ];
  const done = orderTimelineStep(order);

  return (
    <ol className="flex items-start" aria-label="สถานะคำสั่งซื้อ">
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
                    : "border border-stone-200 bg-white text-stone-400"
              }`}
            >
              {passed ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={`px-0.5 text-[11px] leading-tight sm:text-xs ${passed ? "font-semibold text-stone-800" : current ? "font-semibold text-amber-700" : "text-stone-400"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
