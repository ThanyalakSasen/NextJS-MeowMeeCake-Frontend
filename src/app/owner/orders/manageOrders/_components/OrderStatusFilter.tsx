"use client";
// dropdown กรองตามสถานะออเดอร์ พร้อมจำนวนต่อสถานะ (count มาจากออเดอร์ก่อนกรองสถานะ/การชำระเงิน)
import { Select } from "@/components/base";
import { useTranslations } from "next-intl";
import { ORDER_STATUS_FLOW } from "@/constants/enumConfig";
import type { OrderStatus } from "@/constants/enumConfig";
import type { Order } from "@/types/order";
import { FilterField } from "@/components/shared/data";

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
    <FilterField label={t("filterLabel.orderStatus")} minWidth={210}>
      <Select
        value={value}
        onChange={(v) => onChange(v as OrderStatus | "all")}
        popupMatchSelectWidth={false}
        options={[
          { value: "all", label: `${t("common.all")} (${countOf("all")})` },
          ...ORDER_STATUS_FLOW.map((s) => ({
            value: s,
            label: `${t(`enums.orderStatus.${s}`)} (${countOf(s)})`,
          })),
        ]}
      />
    </FilterField>
  );
}
