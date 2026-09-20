// src/services/notifications.ts — /admin/notifications
// เห็นร่วมกันทั้งร้าน (ไม่ผูก user คนเดียว) + ทุกรายการ push ซ้ำเข้า LINE คู่กันฝั่ง backend แล้ว
// (ดู src/services/notificationService.ts, src/lib/line.ts ของ backend) — ไม่มี create() ให้เรียก
// เอง เพราะแจ้งเตือนเกิดจากเหตุการณ์จริง (ออเดอร์ใหม่ / สต็อกใกล้หมด / สลิปเข้า) ฝั่ง backend เท่านั้น
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { NotificationDTO, NotificationListParams } from "@/types/notification";

const BASE = "/admin/notifications";

export const notificationsService = {
  list: (params: NotificationListParams = {}) => http.getList<NotificationDTO>(BASE, { params }),
  markRead: (id: string) =>
    http.patch<ItemResponse<NotificationDTO>>(`${BASE}/${id}`, { is_read: true }),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
