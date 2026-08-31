"use client";
import { useQuery } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications";

/** แจ้งเตือน N รายการล่าสุด สำหรับ dropdown ใน Navbar */
export function useNotifications(limit = 5) {
  const q = useQuery({
    queryKey: ["notifications", { limit }],
    queryFn: () => notificationsService.list({ limit, sort: "-created_at" }),
  });
  const list = q.data?.data ?? [];
  return {
    notifications: list,
    unreadCount: list.filter((n) => !n.is_read).length,
    isLoading: q.isLoading,
  };
}
