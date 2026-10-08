// DTO ของ /notifications — docs/API_CONTRACT.md §3
import type { ListParams } from "@/types/api";
import type { NotificationType } from "@/types";

/** หมวดที่ backend สร้าง/กรองได้ (ตรงกับ enum ของ notificationModel) */
export type NotificationModule = "order" | "ingredient" | "production" | "finance" | "customer" | "system";
export const NOTIFICATION_MODULES: NotificationModule[] = ["order", "ingredient", "production", "finance", "customer", "system"];

/**
 * หมวดที่เลิกใช้แล้วแต่ยังมีในเอกสารเก่า — แสดงผลอย่างเดียว (BACKLOG3 I3)
 * "employee" backend เลิกสร้าง 2026-10-01 · ป้าย i18n enums.notificationModule.employee คงไว้ให้แถวเก่าแสดงชื่อได้
 */
export type LegacyNotificationModule = "employee";

export interface NotificationDTO {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  module: NotificationModule | LegacyNotificationModule;
  is_read: boolean;
  link?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListParams extends ListParams {
  is_read?: boolean;
  module?: NotificationModule;
  type?: NotificationType;
}
