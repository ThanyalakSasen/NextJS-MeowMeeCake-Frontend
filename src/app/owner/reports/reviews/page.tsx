import { HydrationBoundary } from "@tanstack/react-query";
import { reviewAspectsService, reviewsService } from "@/services/reviews";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import ReviewsPageClient from "./ReviewsPageClient";
import { initialReviewListParams, REVIEW_ASPECTS_KEY, REVIEW_FILTER_OPTIONS_KEY, REVIEWS_LIST_KEY } from "./reviewsQuery";

// แท็บ sync กับ ?tab= (ไม่ระบุ = แดชบอร์ด) — อ่านฝั่ง server แล้วส่งเป็น prop (render ฝั่ง server ได้ทั้งหน้า · OwnerLayout SSR_PAGES)
// แท็บจัดการรีวิว: ดึงรีวิวหน้าแรก (ยังไม่กรอง) + ตัวเลือกตัวกรองฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมโหลดหลัง JS ทำงาน (Lighthouse มือถือ Speed Index 3.8 วิ) · query key ร่วมกับ ViewModel ที่ reviewsQuery.ts ·
// backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const tab = (await searchParams).tab === "manage" ? "manage" : "dashboard";
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me (เดิมรอต่อกัน 2 ทอดไป backend) · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const params = initialReviewListParams();
  const state = await prefetchPublic(
    tab === "manage" && h
      ? [
          { queryKey: [...REVIEWS_LIST_KEY, params], queryFn: () => reviewsService.list(params, h) },
          { queryKey: [...REVIEW_FILTER_OPTIONS_KEY], queryFn: () => reviewsService.filterOptions(h) },
          { queryKey: [...REVIEW_ASPECTS_KEY], queryFn: () => reviewAspectsService.list(h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <ReviewsPageClient tab={tab} />
    </HydrationBoundary>
  );
}
