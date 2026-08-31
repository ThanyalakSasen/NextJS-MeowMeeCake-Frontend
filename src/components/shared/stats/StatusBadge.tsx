"use client";
// ─────────────────────────────────────────────────────────────
// StatusBadge — antd Tag สีตาม enum config + label จาก i18n
//   <StatusBadge group="orderStatus" value={order.order_status} />
// group + value ตรวจชนิดที่ call site (value ต้องเป็นค่าที่มีจริงใน group นั้น)
// ─────────────────────────────────────────────────────────────
import { Tag } from "@/components/base";
import { useTranslations } from "next-intl";
import en from "@/i18n/messages/en.json";
import {
  ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, PRODUCTION_STATUS_CONFIG,
  PRODUCTION_ITEM_STATUS_CONFIG, STOCK_STATUS_CONFIG,
} from "@/constants/enumConfig";

type Group =
  | "orderStatus" | "paymentStatus" | "productionStatus" | "productionItemStatus" | "stockStatus";

type ValueOf<G extends Group> = keyof (typeof en)["enums"][G] & string;

const CONFIG: Record<Group, Record<string, { antColor: string }>> = {
  orderStatus: ORDER_STATUS_CONFIG,
  paymentStatus: PAYMENT_STATUS_CONFIG,
  productionStatus: PRODUCTION_STATUS_CONFIG,
  productionItemStatus: PRODUCTION_ITEM_STATUS_CONFIG,
  stockStatus: STOCK_STATUS_CONFIG,
};

export function StatusBadge<G extends Group>({ group, value }: { group: G; value: ValueOf<G> }) {
  const t = useTranslations("enums");
  const conf = CONFIG[group][value];
  // key ประกอบจาก group + value (ตรวจชนิดครบที่ call site แล้ว) — cast ให้ next-intl เพราะ key เป็น dynamic
  const key = `${group}.${value}` as Parameters<typeof t>[0];
  return <Tag color={conf?.antColor}>{t(key)}</Tag>;
}
