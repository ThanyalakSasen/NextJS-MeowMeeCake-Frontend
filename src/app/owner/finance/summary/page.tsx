import { HydrationBoundary } from "@tanstack/react-query";
import dayjs from "dayjs";
import { expensesService } from "@/services/expenses";
import { reportsService } from "@/services/reports";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import FinanceSummaryPage from "./FinanceSummaryPageClient";
import { getRangeStartEnd } from "@/utils/period";
import { financeTrendKey, revenueKey, trendBuckets } from "./summaryRanges";
import { expenseSummaryKey } from "../expensesQuery";

// สรุปกำไร-ขาดทุน — ดึงข้อมูลค่าเริ่มต้น (รายเดือน · เดือนนี้) ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML:
// ยอดค่าใช้จ่ายรวมตามหมวด + รายรับของเดือนนี้ (การ์ด/ตาราง P&L) + ตารางเปรียบเทียบ ม.ค. ถึงเดือนนี้ (finance-trend คำขอเดียว)
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน + ยิง API (Lighthouse มือถือ LCP 3.8 วิ) · ช่วงเวลาคำนวณด้วยโค้ดเดียวกับ ViewModel
// (summaryRanges.ts · server ตั้งเวลาไทยใน instrumentation.ts) · backend ช้า/ไม่มี user → browser ดึงเอง (รอไม่เกิน 2.5 วิ)
export default async function FinanceSummaryRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me (เดิมรอต่อกัน 2 ทอดไป backend) · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const buckets = trendBuckets("month", dayjs());
  const [start, end] = getRangeStartEnd("month", dayjs());
  const from = start.toISOString();
  const to = end.toISOString();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...expenseSummaryKey(from, to)], queryFn: () => expensesService.summary({ date_from: from, date_to: to }, h) },
          { queryKey: revenueKey(from, to), queryFn: () => reportsService.revenueByChannel({ date_from: from, date_to: to }, h) },
          { queryKey: [...financeTrendKey(buckets)], queryFn: () => reportsService.financeTrend(buckets, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <FinanceSummaryPage />
    </HydrationBoundary>
  );
}
