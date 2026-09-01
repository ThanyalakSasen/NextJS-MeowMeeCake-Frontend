"use client";
// ขั้นตอนสถานะออเดอร์ — antd Steps ตาม ORDER_STATUS_FLOW (ยกเลิกแล้วไม่ผ่านตัวนี้ — เช็คที่ผู้เรียก)
import { Steps } from "antd";
import { useTranslations } from "next-intl";
import { ORDER_STATUS_FLOW } from "@/constants/enumConfig";
import type { OrderStatus } from "@/constants/enumConfig";

export function OrderLifecycleSteps({ status }: { status: OrderStatus }) {
  const t = useTranslations("enums.orderStatus");
  const current = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <Steps
      size="small"
      current={current === -1 ? 0 : current}
      items={ORDER_STATUS_FLOW.map((s) => ({ title: t(s) }))}
    />
  );
}
