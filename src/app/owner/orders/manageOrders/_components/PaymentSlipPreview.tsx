"use client";
// สลิปโอนเงินในตาราง — thumbnail (คลิกขยายได้ในตัวจาก antd Image) + จุดเตือนถ้ายังไม่ตรวจ
import { Image, Tooltip } from "antd";
import { useTranslations } from "next-intl";
import type { Order } from "@/types/order";

export function PaymentSlipPreview({
  order,
}: {
  order: Pick<Order, "order_no" | "payment_slip_url" | "payment_verified_at">;
}) {
  const t = useTranslations("orders");

  if (!order.payment_slip_url) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Image
        src={order.payment_slip_url}
        alt={t("slipAlt", { no: order.order_no })}
        width={32}
        height={32}
        className="rounded border border-gray-200 !object-cover"
      />
      {!order.payment_verified_at && (
        <Tooltip title={t("slipAwaitingReview")}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" aria-label={t("slipAwaitingReview")} />
        </Tooltip>
      )}
    </div>
  );
}
