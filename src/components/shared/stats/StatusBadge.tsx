"use client";
// ─────────────────────────────────────────────────────────────
// StatusBadge — antd Tag สีตาม enum config + label จาก i18n
// ใช้กับ Orders, Production, Payments, Stock ฯลฯ (10+ screens)
//
//   <StatusBadge group="orderStatus" value={order.order_status} />
// ─────────────────────────────────────────────────────────────
import { Tag } from "@/components/base";
import { useTranslations } from "next-intl";
import {
  ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, PRODUCTION_STATUS_CONFIG,
  PRODUCTION_ITEM_STATUS_CONFIG, STOCK_STATUS_CONFIG,
} from "@/constants/enumConfig";

type Group =
  | "orderStatus" | "paymentStatus" | "productionStatus" | "productionItemStatus" | "stockStatus";

const CONFIG: Record<Group, Record<string, { antColor: string }>> = {
  orderStatus: ORDER_STATUS_CONFIG,
  paymentStatus: PAYMENT_STATUS_CONFIG,
  productionStatus: PRODUCTION_STATUS_CONFIG,
  productionItemStatus: PRODUCTION_ITEM_STATUS_CONFIG,
  stockStatus: STOCK_STATUS_CONFIG,
};

export function StatusBadge({ group, value }: { group: Group; value: string }) {
  const t = useTranslations(`enums.${group}`);
  const conf = CONFIG[group][value];
  return <Tag color={conf?.antColor}>{t(value)}</Tag>;
}
