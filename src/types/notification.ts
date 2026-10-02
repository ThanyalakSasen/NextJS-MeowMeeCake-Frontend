// DTO ของ /notifications — docs/API_CONTRACT.md §3
import type { ListParams } from "@/types/api";
import type { NotificationType } from "@/types";

// "employee" — backend เลิกใช้แล้ว (LINE.md §9.10: ไม่มีจุดไหนสร้างใหม่) แต่เอกสารเก่ายังอ่านได้ → คงไว้ใน type
// + i18n เพื่อแสดงป้ายเอกสารเก่า · ไม่อยู่ในตัวกรองหน้า Notification History แล้ว
export type NotificationModule =
  | "order" | "ingredient" | "production" | "employee" | "finance" | "system";

export interface NotificationDTO {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  module: NotificationModule;
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
