"use client";
import { useRouter } from "next/navigation";
import { useReviewsViewModel } from "./useReviewsViewModel";
import { useReviewDashboardViewModel } from "./dashboard/useReviewDashboardViewModel";
import { ReviewsReportView, type ReviewsTab } from "./ReviewsReportView";
import type { ReviewsLinkView } from "./reviewsQuery";

const PATH = "/owner/reports/reviews";

// แท็บมาจาก ?tab= ผ่าน page.tsx (server) — ไม่ใช้ useSearchParams (ต้องครอบ Suspense → เนื้อหาถูกส่งท้าย HTML)
// ViewModel ทั้งสองอยู่ที่นี่ · ดึงข้อมูลเฉพาะแท็บที่เปิด (enabled) → สลับแท็บแล้วตัวกรอง/หน้าที่ดูอยู่ไม่หาย · สลับแท็บ = router.replace → server ส่ง tab ใหม่มา
export default function ReviewsPageClient({ tab, view }: { tab: ReviewsTab; view?: ReviewsLinkView }) {
  const router = useRouter();
  const manage = useReviewsViewModel({ enabled: tab === "manage", initialView: view });
  const dashboard = useReviewDashboardViewModel({ enabled: tab === "dashboard" });
  return (
    <ReviewsReportView
      tab={tab}
      onTab={(next) => router.replace(`${PATH}?tab=${next}`, { scroll: false })}
      manage={manage}
      dashboard={dashboard}
    />
  );
}
