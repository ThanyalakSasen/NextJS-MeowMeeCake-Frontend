"use client";
// ─────────────────────────────────────────────────────────────
// NextAction — บอกให้ชัดว่า "ตอนนี้ใครต้องทำอะไร" ของออเดอร์/พรีออเดอร์
//   customer = ลูกค้าต้องทำ (ชำระ/แนบสลิปใหม่/มารับ) · shop = รอร้าน (ตรวจสลิป/เตรียม/จัดส่ง/คืนเงิน) · none = จบแล้ว
// ใช้ทั้งหน้ารายการ (บรรทัดเดียว) และหน้ารายละเอียด (แถบเต็ม)
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { Store, UserRound, CheckCircle2 } from "lucide-react";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";
import type { OrderType } from "@/types/order";

export interface NextActionInput {
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  order_type: OrderType;
  has_payment: boolean;
  delivery_status: string | null;
}

export type ActionWho = "customer" | "shop" | "none";
export type ActionKey =
  | "pay"
  | "reupload"
  | "verifySlip"
  | "confirm"
  | "prepare"
  | "pickup"
  | "ship"
  | "receive"
  | "refund"
  | "done"
  | "cancelled";

export function nextAction(o: NextActionInput): { who: ActionWho; key: ActionKey } {
  if (o.order_status === "cancelled") {
    return o.payment_status === "paid" ? { who: "shop", key: "refund" } : { who: "none", key: "cancelled" };
  }
  if (o.order_status === "completed") return { who: "none", key: "done" };
  if (o.payment_status === "refunded") return { who: "none", key: "cancelled" };
  if (o.payment_status !== "paid") {
    if (o.payment_status === "failed") return { who: "customer", key: "reupload" };
    return o.has_payment ? { who: "shop", key: "verifySlip" } : { who: "customer", key: "pay" };
  }
  // ชำระแล้ว
  if (o.order_status === "pending") return { who: "shop", key: "confirm" };
  if (o.order_status === "confirmed" || o.order_status === "preparing") return { who: "shop", key: "prepare" };
  // ready
  if (o.order_type === "delivery") {
    return o.delivery_status === "delivered" ? { who: "customer", key: "receive" } : { who: "shop", key: "ship" };
  }
  return { who: "customer", key: "pickup" };
}

const TONE: Record<ActionWho, string> = {
  customer: "border-red-200 bg-red-50 text-red-800",
  shop: "border-amber-200 bg-amber-50 text-amber-800",
  none: "border-emerald-200 bg-emerald-50 text-emerald-800",
};
const TEXT_TONE: Record<ActionWho, string> = {
  customer: "text-red-600",
  shop: "text-amber-600",
  none: "text-emerald-700",
};

function WhoIcon({ who, className }: { who: ActionWho; className?: string }) {
  if (who === "customer") return <UserRound className={className} aria-hidden="true" />;
  if (who === "shop") return <Store className={className} aria-hidden="true" />;
  return <CheckCircle2 className={className} aria-hidden="true" />;
}

/** แถบเต็มในหน้ารายละเอียด — "ผู้ที่ต้องดำเนินการ: คุณ/ร้าน" + สิ่งที่ต้องทำ + คำอธิบาย */
export function NextActionBanner({ order }: { order: NextActionInput }) {
  const t = useTranslations("shop.nextAction");
  const { who, key } = nextAction(order);
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${TONE[who]}`} role="status">
      <WhoIcon who={who} className="mt-0.5 h-6 w-6 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        <p className="m-0 text-xs font-bold uppercase tracking-wide opacity-80">{t(`who.${who}`)}</p>
        <p className="m-0 text-base font-bold">{t(`title.${key}`)}</p>
        <p className="m-0 text-sm opacity-90">{t(`hint.${key}`)}</p>
      </div>
    </div>
  );
}

/** บรรทัดเดียวในหน้ารายการ — "[คุณ] ชำระเงินและแนบสลิป" */
export function NextActionLine({ order }: { order: NextActionInput }) {
  const t = useTranslations("shop.nextAction");
  const { who, key } = nextAction(order);
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${TEXT_TONE[who]}`}>
      <WhoIcon who={who} className="h-3.5 w-3.5 shrink-0" />
      <span className="font-bold">{t(`short.${who}`)}</span>
      <span>{t(`title.${key}`)}</span>
    </span>
  );
}
