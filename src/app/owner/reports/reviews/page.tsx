"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useReviewsViewModel } from "./useReviewsViewModel";
import { useReviewDashboardViewModel } from "./dashboard/useReviewDashboardViewModel";
import { ReviewsReportView, type ReviewsTab } from "./ReviewsReportView";

const PATH = "/owner/reports/reviews";

// แท็บ sync กับ ?tab= (ไม่ระบุ = แดชบอร์ด) · ViewModel ทั้งสองอยู่ที่นี่ → สลับแท็บแล้วตัวกรอง/หน้าที่ดูอยู่ไม่หาย
// useSearchParams ต้องอยู่ใต้ Suspense boundary
function ReviewsInner() {
  const router = useRouter();
  const tab: ReviewsTab = useSearchParams().get("tab") === "manage" ? "manage" : "dashboard";
  const manage = useReviewsViewModel();
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

export default function ReviewsPage() {
  return (
    <Suspense>
      <ReviewsInner />
    </Suspense>
  );
}
