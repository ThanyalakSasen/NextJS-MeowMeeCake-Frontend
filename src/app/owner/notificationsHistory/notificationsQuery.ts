// ─────────────────────────────────────────────────────────────
// notificationsQuery.ts — pure: query key/params ของหน้าประวัติการแจ้งเตือน
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { notificationsService } from "@/services/notifications";
import { LIST_ALL, type HttpReader } from "@/lib/http";
import type { NotificationDTO } from "@/types/notification";

export const NOTIFICATION_HISTORY_PARAMS = { limit: LIST_ALL, sort: "-created_at" };
export const NOTIFICATION_HISTORY_KEY = ["notifications", { history: true }] as const;

export interface NotificationHistoryData {
  data: NotificationDTO[];
  /** มีการแจ้งเตือนที่อ่านแล้วเก่ากว่ารายการที่โหลดไว้ (ไม่แสดงในตาราง) */
  olderHidden: boolean;
  /** ยอดจริงจาก backend (ไม่ขึ้นกับจำนวนที่โหลด) — การ์ดสถิติ */
  total: number;
  unread: number;
  warning: number;
  error: number;
}

// เดิมโหลด 1,000 รายการล่าสุดก้อนเดียว — เกินนั้นยังไม่อ่านที่เก่ากว่าไม่ขึ้น (กด "อ่านทั้งหมด" ก็ไม่ถึง) และสถิติหยุดที่ 1,000
// ตอนนี้: ยังไม่อ่าน = โหลดครบเสมอ + ล่าสุด LIST_ALL รายการ · ตัวเลขบนการ์ด = ยอดจริงจาก meta.total ของ backend
export async function fetchNotificationHistory(h?: HttpReader): Promise<NotificationHistoryData> {
  const count = (params: Record<string, string | boolean>) =>
    notificationsService.list({ ...params, limit: 1 }, h).then((r) => r.meta.total);
  const [unread, recent, warning, error] = await Promise.all([
    notificationsService.list({ ...NOTIFICATION_HISTORY_PARAMS, is_read: false }, h),
    notificationsService.list(NOTIFICATION_HISTORY_PARAMS, h),
    count({ type: "warning" }),
    count({ type: "error" }),
  ]);
  const byId = new Map<string, NotificationDTO>();
  for (const n of [...unread.data, ...recent.data]) byId.set(n._id, n);
  return {
    data: [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    olderHidden: recent.meta.total > recent.data.length,
    total: recent.meta.total,
    unread: unread.meta.total,
    warning,
    error,
  };
}
