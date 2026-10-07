"use client";
// ─────────────────────────────────────────────────────────────
// useCustomerNotifications — กระดิ่ง + หน้าการแจ้งเตือน (BACKLOG3-merge D6) · แทน FrontOffice useCustomerNotifications
// React Query: โหลดใหม่ทุก 60 วินาทีเฉพาะตอนแท็บแสดงอยู่ + ตอนกลับมาโฟกัส · กระดิ่งกับหน้าเต็มใช้ cache คนละ limit
// อ่าน (รายการเดียว/ทั้งหมด) → แก้ cache ทันทีทุกชุด แล้วให้ backend ยืนยันจำนวนที่ยังไม่อ่าน
// ─────────────────────────────────────────────────────────────
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { shopNotificationsService, type NotificationInbox } from "@/services/shopNotifications";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { shopNotificationsKey } from "../lib/shopQueries";

const POLL_MS = 60_000;

export function useCustomerNotifications(limit: number) {
  const qc = useQueryClient();
  const { status } = useCustomerSession();
  const q = useQuery({
    queryKey: [...shopNotificationsKey, limit],
    queryFn: () => shopNotificationsService.inbox(limit),
    enabled: status === "authenticated",
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });

  const patchAll = (fn: (inbox: NotificationInbox) => NotificationInbox) =>
    qc.setQueriesData<NotificationInbox>({ queryKey: shopNotificationsKey }, (old) => (old ? fn(old) : old));

  const markRead = async (id: string) => {
    const now = new Date().toISOString();
    patchAll((inbox) => {
      const wasUnread = inbox.items.some((n) => n._id === id && !n.read_at);
      return {
        items: inbox.items.map((n) => (n._id === id && !n.read_at ? { ...n, read_at: now } : n)),
        unread_count: Math.max(0, inbox.unread_count - (wasUnread ? 1 : 0)),
      };
    });
    const unread = await shopNotificationsService.markRead(id).catch(() => null);
    if (unread !== null) patchAll((inbox) => ({ ...inbox, unread_count: unread }));
  };

  const markAllRead = async () => {
    const now = new Date().toISOString();
    patchAll((inbox) => ({ items: inbox.items.map((n) => (n.read_at ? n : { ...n, read_at: now })), unread_count: 0 }));
    await shopNotificationsService.markAllRead().catch(() => void qc.invalidateQueries({ queryKey: shopNotificationsKey }));
  };

  return {
    items: q.data?.items ?? [],
    unread: q.data?.unread_count ?? 0,
    loaded: q.isSuccess,
    isError: q.isError,
    refresh: () => q.refetch(),
    markRead,
    markAllRead,
  };
}
