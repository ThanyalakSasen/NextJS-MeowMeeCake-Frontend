// src/services/notifications.ts — /notifications
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse } from "@/types/api";
import type { NotificationDTO, NotificationListParams } from "@/types/notification";

export const notificationsService = {
  list: (params: NotificationListParams = {}) =>
    http.get<ListResponse<NotificationDTO>>("/notifications", { params }),
  markRead: (id: string) =>
    http.patch<ItemResponse<NotificationDTO>>(`/notifications/${id}`, { is_read: true }),
};
