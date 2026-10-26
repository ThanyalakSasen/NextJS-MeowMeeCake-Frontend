"use client";
// ป้ายผลการส่ง LINE (ส่งแล้ว / ส่งไม่สำเร็จ / เว็บอย่างเดียว) — ใช้ทั้งในตารางและป๊อปอัปรายละเอียด
import { useTranslations } from "next-intl";
import { Tag } from "@/components/base";
import { LINE_DELIVERY_CONFIG } from "@/constants/enumConfig";
import type { NotificationDTO } from "@/types/notification";
import { lineDeliveryStatus } from "../lineStatus";

export function LineStatusTag({ notif }: { notif: NotificationDTO }) {
  const t = useTranslations("notifications");
  const status = lineDeliveryStatus(notif);
  return <Tag color={LINE_DELIVERY_CONFIG[status].antColor}>{t(`lineStatus.${status}`)}</Tag>;
}
