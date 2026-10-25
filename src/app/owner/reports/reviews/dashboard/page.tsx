import ReviewsPage from "../page";

// แดชบอร์ดย้ายไปเป็นแท็บในหน้ารายงานความคิดเห็น — คงไว้ให้ลิงก์/บุ๊กมาร์กเดิมใช้ได้
// render แท็บแดชบอร์ดที่นี่เลยแทน redirect ไป ?tab=dashboard — การเด้งหนึ่งทอดทำ Lighthouse มือถือ LCP +2 วิ (80 คะแนน)
// สลับแท็บแล้ว URL ไปเป็น /owner/reports/reviews?tab=… ตามปกติ (ReviewsPageClient)
export default function ReviewDashboardPage() {
  return <ReviewsPage searchParams={Promise.resolve({ tab: "dashboard" })} />;
}
