// ─────────────────────────────────────────────────────────────
// src/services/shopNotifications.ts — กระดิ่งแจ้งเตือนของลูกค้า (/shop/notifications) · หน้าร้าน (BACKLOG3-merge D6)
// backend customerNotifyService: ของตัวเอง · ถึงเวลาแสดงแล้ว (visible_at) · ล่าสุดก่อน · GET คืน { items, unread_count }
// (ไม่ใช่ { items, meta } ของ list ทั่วไป — ใช้ http.get ตรง)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";

export type CustomerNotificationType = "info" | "success" | "warning" | "error";

export interface CustomerNotification {
  _id: string;
  title: string;
  message: string;
  type: CustomerNotificationType;
  /** path ในเว็บ (backend ตั้ง) — ผ่าน notificationHref ก่อนใช้ */
  link: string | null;
  ref_type: "order" | "preorder" | "coupon" | "bundle" | "preorder_round" | null;
  ref_id: string | null;
  read_at: string | null;
  created_at: string;
  /** เวลาที่เริ่มแสดง (บันทึกล่วงหน้าได้) */
  visible_at: string | null;
}

export interface NotificationInbox {
  items: CustomerNotification[];
  unread_count: number;
}

/**
 * ปลายทางเมื่อกดแจ้งเตือน — ออเดอร์/พรีออเดอร์ไปหน้ารายละเอียดจาก ref_id
 * (backend ตั้ง link ของพรีออเดอร์เป็นหน้ารายการ เพราะ FrontOffice ไม่มีหน้ารายละเอียด — repo นี้มีแล้ว D3)
 * link อื่นใช้เฉพาะ path ภายในเว็บ ("/…" ไม่ใช่ "//…") กันพาออกไปเว็บอื่น
 */
export function notificationHref(n: Pick<CustomerNotification, "link" | "ref_type" | "ref_id">): string | null {
  if (n.ref_id && n.ref_type === "order") return `/customer/account/purchases/${n.ref_id}`;
  if (n.ref_id && n.ref_type === "preorder") return `/customer/account/preorders/${n.ref_id}`;
  if (n.link && n.link.startsWith("/") && !n.link.startsWith("//")) return n.link;
  return null;
}

export const shopNotificationsService = {
  /** GET /shop/notifications?limit= (1–100 · ค่าเริ่มต้น 20) */
  inbox: async (limit = 20): Promise<NotificationInbox> => {
    const res = await http.get<ItemResponse<NotificationInbox>>("/shop/notifications", { params: { limit } });
    return { items: res.data.items ?? [], unread_count: Number(res.data.unread_count ?? 0) };
  },
  /** PATCH /shop/notifications/{id} — อ่านรายการเดียว → unread_count ใหม่ */
  markRead: async (id: string): Promise<number> => {
    const res = await http.patch<ItemResponse<{ unread_count: number }>>(`/shop/notifications/${encodeURIComponent(id)}`);
    return Number(res.data.unread_count ?? 0);
  },
  /** PATCH /shop/notifications — อ่านทั้งหมด */
  markAllRead: async (): Promise<void> => {
    await http.patch("/shop/notifications");
  },
};
