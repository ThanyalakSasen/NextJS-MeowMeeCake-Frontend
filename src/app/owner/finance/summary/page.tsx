import { HydrationBoundary } from "@tanstack/react-query";
import dayjs from "dayjs";
import { expensesService } from "@/services/expenses";
import { reportsService } from "@/services/reports";
import { LIST_ALL } from "@/lib/http";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import FinanceSummaryPage from "./FinanceSummaryPageClient";
import { revenueKey, trendBuckets } from "./summaryRanges";

// สรุปกำไร-ขาดทุน — ดึงข้อมูลค่าเริ่มต้น (รายเดือน · เดือนนี้) ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML:
// รายการค่าใช้จ่าย + รายรับของ 12 เดือน (ม.ค.–ธ.ค. ปีนี้) ในตารางเปรียบเทียบ (เดือนนี้ใช้ key เดียวกับการ์ด/ตาราง P&L)
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน + ยิง API (Lighthouse มือถือ LCP 3.8 วิ) · ช่วงเวลาคำนวณด้วยโค้ดเดียวกับ ViewModel
// (summaryRanges.ts · server ตั้งเวลาไทยใน instrumentation.ts) · backend ช้า/ไม่มี user → browser ดึงเอง (รอไม่เกิน 2.5 วิ)
export default async function FinanceSummaryRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me (เดิมรอต่อกัน 2 ทอดไป backend) · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const buckets = trendBuckets("month", dayjs());
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: ["expenses"], queryFn: () => expensesService.list({ limit: LIST_ALL }, h) },
          ...buckets.map((b) => ({
            queryKey: revenueKey(b.from, b.to),
            queryFn: () => reportsService.revenueByChannel({ date_from: b.from, date_to: b.to }, h),
          })),
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <FinanceSummaryPage />
    </HydrationBoundary>
  );
}
