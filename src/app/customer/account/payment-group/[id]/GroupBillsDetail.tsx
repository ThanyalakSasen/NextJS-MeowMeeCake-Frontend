"use client";
// ─────────────────────────────────────────────────────────────
// ฝั่งซ้ายของหน้าชำระรวม — รายละเอียดแบบเดียวกับหน้าชำระบิลเดียว (purchases/[id] · preorders/[id])
// โหลดรายละเอียดทุกบิล (cache เดียวกับหน้ารายละเอียดบิล) แล้วแสดง: วันที่สั่ง · สถานะ · ไทม์ไลน์ · รายการสินค้า ·
// ยอดของแต่ละบิล · นัดรับ / สถานะจัดส่ง · ที่อยู่จัดส่ง · ยอดชำระรวม
// ข้อมูลที่เหมือนกันทุกบิลแสดงครั้งเดียว: วันที่สั่ง · ป้ายสถานะ + ไทม์ไลน์ (ถ้าทุกบิลอยู่ขั้นเดียวกัน) · ที่อยู่จัดส่ง (ถ้าส่งที่เดียวกัน)
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { FaCalendarCheck, FaShoppingCart } from "react-icons/fa";
import { shopOrdersService, type ShopOrder } from "@/services/shopOrders";
import { shopPreordersService, type ShopPreorder } from "@/services/shopPreorders";
import { billHref, type GroupBill, type PaymentGroupPage } from "@/services/shopCheckout";
import { formatDate } from "@/i18n/format";
import { baht, shopCard } from "@/components/customer/shopStyles";
import ShopSpinner from "@/components/customer/ShopSpinner";
import { useLocalName } from "@/app/customer/lib/localName";
import OrderTimeline, { orderTimelineStep } from "../../_components/OrderTimeline";
import OrderItemThumb from "../../_components/OrderItemThumb";
import { useOrderLabels } from "../../purchases/orderLabels";
import { thaiDate } from "../../../preorder/lib/preorderDates";
import { shopOrderKey, shopPreorderKey } from "../../../lib/shopQueries";
import { BillStatus } from "./groupShared";

/** บิล 1 ใบในรูปเดียวกัน (ออเดอร์ / พรีออเดอร์ ฟิลด์ต่างกันเล็กน้อย) */
interface BillDetail {
  bill: GroupBill;
  no: string;
  created_at: string;
  order_type: ShopOrder["order_type"];
  order_status: ShopOrder["order_status"];
  payment_status: ShopOrder["payment_status"];
  delivery_status: string | null;
  shipping_carrier: string | null;
  tracking_no: string | null;
  pickup_date: string | null;
  pickup_point_name: string | null;
  delivery_address: ShopOrder["delivery_address"];
  cancelled_reason: string | null;
  round: ShopPreorder["round"];
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  items: {
    _id: string;
    product_id: string;
    product_name: string;
    product_name_eng: string | null;
    variant_name: string | null;
    quantity: number;
    total_price: number;
    selected_options: { option_name: string; text_value: string | null }[];
    special_request?: string | null;
  }[];
}

function toDetail(bill: GroupBill, raw: ShopOrder | ShopPreorder): BillDetail {
  const isPre = "preorder_no" in raw;
  return {
    bill,
    no: isPre ? raw.preorder_no : raw.order_no,
    created_at: raw.created_at,
    order_type: raw.order_type,
    order_status: raw.order_status,
    payment_status: raw.payment_status,
    delivery_status: raw.delivery_status,
    shipping_carrier: (raw as { shipping_carrier?: string | null }).shipping_carrier ?? null,
    tracking_no: (raw as { tracking_no?: string | null }).tracking_no ?? null,
    pickup_date: raw.pickup_date,
    pickup_point_name: raw.pickup_point_name,
    delivery_address: raw.delivery_address,
    cancelled_reason: (raw as { cancelled_reason?: string | null }).cancelled_reason ?? null,
    round: isPre ? raw.round : null,
    subtotal: raw.subtotal,
    delivery_fee: raw.delivery_fee,
    discount_amount: raw.discount_amount,
    total_amount: raw.total_amount,
    items: raw.items as BillDetail["items"],
  };
}

const addressKey = (a: NonNullable<BillDetail["delivery_address"]>) =>
  [a.recipient_name, a.recipient_phone, a.house_no, a.sub_district, a.district, a.province, a.zip_code].join("|");

export default function GroupBillsDetail({ page }: { page: PaymentGroupPage }) {
  const t = useTranslations("shop.paymentGroup");
  const to = useTranslations("shop.orders");
  const tc = useTranslations("shop.common");
  const locale = useLocale();
  const labels = useOrderLabels();

  // รายละเอียดทุกบิล — query key เดียวกับหน้ารายละเอียดบิล (กดเข้าไปดูต่อไม่ต้องโหลดใหม่)
  const qs = useQueries({
    queries: page.bills.map((b) => ({
      queryKey: b.kind === "order" ? shopOrderKey(b.id) : shopPreorderKey(b.id),
      queryFn: (): Promise<ShopOrder | ShopPreorder> => (b.kind === "order" ? shopOrdersService.get(b.id) : shopPreordersService.get(b.id)),
    })),
  });

  if (qs.some((q) => q.isPending)) {
    return (
      <section className={`${shopCard} flex items-center justify-center py-10 lg:col-span-3`}>
        <ShopSpinner label={tc("loading")} />
      </section>
    );
  }

  // โหลดบางบิลไม่ได้ — แสดงเฉพาะที่ได้ (บิลที่ขาดยังกดเข้าไปดูได้จากรายการ)
  const details = page.bills.flatMap((b, i) => (qs[i].data ? [toDetail(b, qs[i].data!)] : []));
  const first = details[0];

  // เหมือนกันทุกบิล = แสดงครั้งเดียวด้านบน
  const sameStatus = details.every((d) => d.order_status === first?.order_status && d.payment_status === first?.payment_status);
  const sameStep = details.every((d) => d.order_status !== "cancelled" && orderTimelineStep(d) === (first ? orderTimelineStep(first) : -2));
  const deliveries = details.filter((d) => d.order_type === "delivery" && d.delivery_address);
  // รวมเป็นที่เดียวเมื่อมีบิลจัดส่ง ≥ 2 ใบที่ส่งที่เดียวกัน · จัดส่งใบเดียว = แสดงในบิลนั้น (เห็นชัดว่าของบิลไหน)
  const sharedAddress =
    deliveries.length > 1 && deliveries.every((d) => addressKey(d.delivery_address!) === addressKey(deliveries[0].delivery_address!))
      ? deliveries[0].delivery_address
      : null;

  return (
    <section className={`${shopCard} space-y-4 lg:col-span-3`}>
      {/* หัว: เลขที่ = ชำระรวม N บิล · วันที่สั่ง (สั่งพร้อมกัน — ครั้งเดียว) · ป้ายสถานะถ้าทุกบิลเหมือนกัน */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500">{t("bills")}</p>
          <h1 className="text-xl font-extrabold">{t("title", { n: page.bills.length })}</h1>
          {first && <p className="text-xs text-gray-500">{formatDate(first.created_at, locale, { withTime: true })}</p>}
        </div>
        {first && sameStatus && (
          <div className="flex flex-col items-end gap-1 text-xs font-semibold">
            <span className="rounded-full bg-[#8C5A3C]/10 px-2.5 py-1 text-[#8C5A3C]">{labels.orderStatus(first.order_status)}</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{labels.paymentStatus(first.payment_status)}</span>
          </div>
        )}
      </div>

      {first && sameStep && (
        <div className="border-t border-[#8C5A3C]/10 pt-4">
          <OrderTimeline order={first} />
        </div>
      )}

      {details.map((d) => (
        <BillBlock key={d.bill.id} d={d} split={page.status === "split"} showStatus={!sameStatus} showTimeline={!sameStep} showAddress={!sharedAddress} />
      ))}

      {sharedAddress && (
        <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
          <p className="mb-1 font-semibold">{to("deliveryAddress")}</p>
          <p>
            {sharedAddress.recipient_name} · {sharedAddress.recipient_phone}
          </p>
          <p className="text-gray-600">
            {sharedAddress.house_no} {sharedAddress.sub_district} {sharedAddress.district} {sharedAddress.province} {sharedAddress.zip_code}
          </p>
        </div>
      )}

      <div className="flex items-baseline justify-between border-t border-[#8C5A3C]/10 pt-4">
        <span className="font-bold">{t("total")}</span>
        <span className="text-2xl font-extrabold text-[#8C5A3C]">{baht(page.total_amount)}</span>
      </div>
    </section>
  );
}

/** 1 บิล: หัวบิล · รายการ · ยอดของบิล · นัดรับ/สถานะจัดส่ง (ที่อยู่ = เฉพาะตอนแต่ละบิลส่งคนละที่) */
function BillBlock({
  d,
  split,
  showStatus,
  showTimeline,
  showAddress,
}: {
  d: BillDetail;
  split: boolean;
  showStatus: boolean;
  showTimeline: boolean;
  showAddress: boolean;
}) {
  const t = useTranslations("shop.paymentGroup");
  const to = useTranslations("shop.orders");
  const tp = useTranslations("shop.preorders");
  const locale = useLocale();
  const labels = useOrderLabels();
  const { name: localName } = useLocalName();
  const Icon = d.bill.kind === "order" ? FaShoppingCart : FaCalendarCheck;

  return (
    <div className="space-y-3 rounded-2xl border border-[#8C5A3C]/15 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF6F0] text-sm text-[#8C5A3C]">
          <Icon aria-hidden="true" />
        </span>
        <Link href={billHref(d.bill)} className="min-w-0 flex-1 truncate text-sm font-bold text-[#4A342E] hover:text-[#8C5A3C] hover:underline">
          {d.bill.kind === "order" ? t("billOrder", { no: d.no }) : t("billPreorder", { no: d.no })}
        </Link>
        {showStatus && <BillStatus b={d.bill} />}
        {split && d.bill.can_pay && d.bill.payment_status !== "paid" && (
          <Link href={billHref(d.bill)} className="text-xs font-semibold text-[#8C5A3C] underline">{t("paySeparately")}</Link>
        )}
      </div>

      {showTimeline && d.order_status !== "cancelled" && <OrderTimeline order={d} />}

      {d.round && (
        <p className="m-0 rounded-xl bg-[#FAF6F0] p-3 text-sm text-gray-700">
          {tp("round")} <span className="font-semibold">{d.round.round_name}</span>
          {tp("pickupFromDate", { date: thaiDate(d.round.pickup_date, false, locale) })}
        </p>
      )}
      {d.order_status === "cancelled" && d.cancelled_reason && (
        <p className="m-0 rounded-xl bg-stone-100 p-3 text-sm text-stone-600">{to("cancelReason", { reason: d.cancelled_reason })}</p>
      )}

      <div className="space-y-2">
        {d.items.map((it) => (
          <div key={it._id} className="flex items-center gap-3 text-sm">
            <OrderItemThumb productId={it.product_id} alt={it.product_name} className="h-12 w-12" />
            <span className="min-w-0 flex-1">
              {localName(it.product_name, it.product_name_eng)}
              {it.variant_name ? ` (${it.variant_name})` : ""} <span className="text-gray-500">×{it.quantity}</span>
              {it.selected_options.map((o) => (
                <span key={o.option_name} className="block text-xs text-gray-500">
                  + {o.option_name}
                  {o.text_value ? `: "${o.text_value}"` : ""}
                </span>
              ))}
              {it.special_request && <span className="block text-xs text-gray-500">{tp("note", { text: it.special_request })}</span>}
            </span>
            <span className="font-semibold">{baht(it.total_price)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 border-t border-[#8C5A3C]/10 pt-3 text-sm">
        <Row label={to("subtotal")} value={baht(d.subtotal)} />
        <Row label={to("deliveryFee")} value={d.order_type === "takeaway" ? to("pickupAtStore") : baht(d.delivery_fee)} />
        {d.discount_amount > 0 && <Row label={to("discount")} value={`-${baht(d.discount_amount)}`} />}
        <Row label={t("billTotal")} value={baht(d.total_amount)} bold />
      </div>

      {d.order_type === "takeaway" && (d.pickup_point_name || d.pickup_date) && (
        <div className="border-t border-[#8C5A3C]/10 pt-3 text-sm">
          <p className="mb-1 font-semibold">{to("pickupAppointment")}</p>
          <p className="text-gray-600">
            {d.pickup_date ? labels.pickupDate(d.pickup_date) : ""}
            {d.pickup_point_name ? ` · ${d.pickup_point_name}` : ""}
          </p>
        </div>
      )}
      {d.order_type === "delivery" && d.delivery_status && d.order_status !== "cancelled" && (
        <div className="border-t border-[#8C5A3C]/10 pt-3 text-sm">
          <p className="mb-1 font-semibold">{to("deliveryStatus")}</p>
          <p className="text-gray-600">
            {labels.deliveryStatus(d.delivery_status)}
            {d.shipping_carrier && labels.shippingCarrier(d.shipping_carrier) ? to("carrier", { name: labels.shippingCarrier(d.shipping_carrier) }) : ""}
            {d.tracking_no ? to("tracking", { no: d.tracking_no }) : ""}
          </p>
        </div>
      )}
      {showAddress && d.order_type === "delivery" && d.delivery_address && (
        <div className="border-t border-[#8C5A3C]/10 pt-3 text-sm">
          <p className="mb-1 font-semibold">{to("deliveryAddress")}</p>
          <p>
            {d.delivery_address.recipient_name} · {d.delivery_address.recipient_phone}
          </p>
          <p className="text-gray-600">
            {d.delivery_address.house_no} {d.delivery_address.sub_district} {d.delivery_address.district} {d.delivery_address.province} {d.delivery_address.zip_code}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "font-bold text-[#4A342E]" : "text-gray-600"}`}>
      <span>{label}</span>
      <span className={bold ? "" : "font-semibold text-[#4A342E]"}>{value}</span>
    </div>
  );
}
