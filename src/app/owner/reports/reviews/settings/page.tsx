import { HydrationBoundary } from "@tanstack/react-query";
import { reviewAspectsService } from "@/services/reviews";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import ReviewSettingsPage from "./ReviewSettingsPageClient";
import { REVIEW_ASPECTS_KEY } from "../reviewsQuery";

// ตั้งค่ารีวิว — ดึงหัวข้อรีวิว (แท็บแรกที่เปิด) ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมขึ้นวงหมุนจน JS ทำงาน + รอ API · key ร่วมกับ ViewModel (REVIEW_ASPECTS_KEY) · แท็บคำวิเคราะห์ดึงเมื่อเปิดแท็บ (เหมือนเดิม)
export default async function ReviewSettingsRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(h ? [{ queryKey: [...REVIEW_ASPECTS_KEY], queryFn: () => reviewAspectsService.list(h) }] : []);
  return (
    <HydrationBoundary state={state}>
      <ReviewSettingsPage />
    </HydrationBoundary>
  );
}
