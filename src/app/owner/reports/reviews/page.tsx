import { HydrationBoundary } from "@tanstack/react-query";
import { reviewAspectsService, reviewsService } from "@/services/reviews";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import ReviewsPageClient from "./ReviewsPageClient";
import { initialReviewListParams, linkViewFrom, REVIEW_ASPECTS_KEY, REVIEW_FILTER_OPTIONS_KEY, REVIEWS_LIST_KEY } from "./reviewsQuery";

// แท็บ sync กับ ?tab= (ไม่ระบุ = แดชบอร์ด · ลิงก์แจ้งเตือน ?view= = จัดการรีวิว) — อ่านฝั่ง server แล้วส่งเป็น prop (render ฝั่ง server ได้ทั้งหน้า · OwnerLayout SSR_PAGES)
// แท็บแดชบอร์ด: ดึงได้แค่ตัวเลือกสินค้า — สถิติคิดช่วงเวลาจาก timezone ของ browser (server เป็น UTC → key ไม่ตรง)
// แท็บจัดการรีวิว: ดึงรีวิวหน้าแรก (ยังไม่กรอง · มี ?view= = กรองแล้ว key ไม่ตรง จึงข้าม) + ตัวเลือกตัวกรองฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมโหลดหลัง JS ทำงาน (Lighthouse มือถือ Speed Index 3.8 วิ) · query key ร่วมกับ ViewModel ที่ reviewsQuery.ts ·
// backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const view = linkViewFrom(sp.tab ? undefined : sp.view);
  const tab = sp.tab === "manage" || view ? "manage" : "dashboard";
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me (เดิมรอต่อกัน 2 ทอดไป backend) · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const params = initialReviewListParams();
  const state = await prefetchPublic(
    !h
      ? []
      : tab === "dashboard"
        ? [{ queryKey: [...REVIEW_FILTER_OPTIONS_KEY], queryFn: () => reviewsService.filterOptions(h) }]
        : [
            ...(view ? [] : [{ queryKey: [...REVIEWS_LIST_KEY, params], queryFn: () => reviewsService.list(params, h) }]),
            { queryKey: [...REVIEW_FILTER_OPTIONS_KEY], queryFn: () => reviewsService.filterOptions(h) },
            { queryKey: [...REVIEW_ASPECTS_KEY], queryFn: () => reviewAspectsService.list(h) },
          ],
  );
  return (
    <HydrationBoundary state={state}>
      <ReviewsPageClient tab={tab} view={view} />
    </HydrationBoundary>
  );
}
