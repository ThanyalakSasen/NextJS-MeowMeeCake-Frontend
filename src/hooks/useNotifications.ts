"use client";
// ─────────────────────────────────────────────────────────────
// useNotifications — กระดิ่งหลังร้าน (Navbar) · แบบเดียวกับ useCustomerNotifications ฝั่งลูกค้า
// โหลดใหม่ทุก 60 วิ เฉพาะตอนแท็บแสดงอยู่ · จำนวนที่ยังไม่อ่านขอ backend แยก (meta.total ของ ?is_read=false)
// เดิมนับจาก N รายการที่โหลดมา → เกิน N รายการตัวเลขไม่ครบ
// backend ไม่มี "อ่านทั้งหมด" → PATCH ทีละรายการ (แบบหน้าประวัติการแจ้งเตือน) · key ขึ้นต้น ["notifications"]
// ร่วมกับหน้าประวัติ — อ่านจากกระดิ่งแล้วหน้าประวัติอัปเดตตาม (และกลับกัน)
// ─────────────────────────────────────────────────────────────
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications";
import { LIST_ALL } from "@/lib/http";

const KEY = ["notifications"] as const;
const POLL_MS = 60_000;
const poll = { refetchInterval: POLL_MS, refetchIntervalInBackground: false, staleTime: 15_000 } as const;

export function useNotifications(limit = 8) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: [...KEY, { limit }],
    queryFn: () => notificationsService.list({ limit, sort: "-created_at" }),
    ...poll,
  });
  const unreadQ = useQuery({
    queryKey: [...KEY, { unreadCount: true }],
    queryFn: () => notificationsService.list({ is_read: false, limit: 1 }).then((r) => r.meta.total),
    ...poll,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const markRead = async (id: string) => {
    qc.setQueryData<number>([...KEY, { unreadCount: true }], (n) => (n ? n - 1 : n));
    await notificationsService.markRead(id).catch(() => null);
    void invalidate();
  };

  const markAllRead = async () => {
    qc.setQueryData<number>([...KEY, { unreadCount: true }], 0);
    try {
      const unread = await notificationsService.list({ is_read: false, limit: LIST_ALL });
      await Promise.all(unread.data.map((n) => notificationsService.markRead(n._id)));
    } finally {
      void invalidate();
    }
  };

  return {
    notifications: q.data?.data ?? [],
    unreadCount: unreadQ.data ?? 0,
    refresh: () => void invalidate(),
    markRead,
    markAllRead,
  };
}
