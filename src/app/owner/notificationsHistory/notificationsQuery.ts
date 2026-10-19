// ─────────────────────────────────────────────────────────────
// notificationsQuery.ts — pure: query key/params ของหน้าประวัติการแจ้งเตือน
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

export const NOTIFICATION_HISTORY_PARAMS = { limit: LIST_ALL, sort: "-created_at" };
export const NOTIFICATION_HISTORY_KEY = ["notifications", { history: true }] as const;
