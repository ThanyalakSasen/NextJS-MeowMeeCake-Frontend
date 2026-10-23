import { HydrationBoundary } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import NotificationHistoryPage from "./NotificationHistoryPageClient";
import { NOTIFICATION_HISTORY_KEY, NOTIFICATION_HISTORY_PARAMS } from "./notificationsQuery";

// ประวัติการแจ้งเตือน — ดึงการแจ้งเตือนฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมการ์ดสถิติ/ตารางขึ้นหลัง JS ทำงาน + รอ API · key ร่วมกับ ViewModel ที่ notificationsQuery.ts
// (collection เดียว ไม่มีตัวเติมชื่อแบบ user-logs — ดึงทั้งหมดได้ทันเพดาน prefetch)
export default async function NotificationHistoryRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h ? [{ queryKey: [...NOTIFICATION_HISTORY_KEY], queryFn: () => notificationsService.list(NOTIFICATION_HISTORY_PARAMS, h) }] : [],
  );
  return (
    <HydrationBoundary state={state}>
      <NotificationHistoryPage />
    </HydrationBoundary>
  );
}
