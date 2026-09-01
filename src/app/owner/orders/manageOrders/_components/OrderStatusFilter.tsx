"use client";
// dropdown กรองตามสถานะออเดอร์ พร้อมจำนวนต่อสถานะ (count มาจากออเดอร์ก่อนกรองสถานะ/การชำระเงิน)
import { Select } from "@/components/base";
import { useTranslations } from "next-intl";
import { ORDER_STATUS_FLOW, ORDER_STATUS_CONFIG } from "@/constants/enumConfig";
import type { OrderStatus } from "@/constants/enumConfig";
import type { Order } from "@/types/order";

export function OrderStatusFilter({
  orders,
  value,
  onChange,
}: {
  orders: Order[];
  value: OrderStatus | "all";
  onChange: (v: OrderStatus | "all") => void;
}) {
  const t = useTranslations();
  const countOf = (s: OrderStatus | "all") =>
    s === "all" ? orders.length : orders.filter((o) => o.order_status === s).length;

  return (
    <div style={{ minWidth: 210 }}>
      <Select
        value={value}
        onChange={(v) => onChange(v as OrderStatus | "all")}
        popupMatchSelectWidth={false}
        options={[
          { value: "all", label: `${t("common.all")} (${countOf("all")})` },
          ...ORDER_STATUS_FLOW.map((s) => ({
            value: s,
            label: (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: ORDER_STATUS_CONFIG[s].color }}
                />
                {t(`enums.orderStatus.${s}`)} ({countOf(s)})
              </span>
            ),
          })),
        ]}
      />
    </div>
  );
}
