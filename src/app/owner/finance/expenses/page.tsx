import { HydrationBoundary } from "@tanstack/react-query";
import { expensesService } from "@/services/expenses";
import { reportsService } from "@/services/reports";
import { LIST_ALL } from "@/lib/http";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import { bangkokMonthRangeIso } from "@/utils/period";
import FinanceExpensesPage from "./FinanceExpensesPageClient";

// บันทึกค่าใช้จ่าย — ดึงรายการค่าใช้จ่าย + รายรับเดือนนี้ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน + ยิง API (Lighthouse มือถือ LCP 4.6 วิ) · query key ตรงกับ useFinanceExpensesViewModel ·
// backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function FinanceExpensesRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me (เดิมรอต่อกัน 2 ทอดไป backend) · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const [from, to] = bangkokMonthRangeIso();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: ["expenses"], queryFn: () => expensesService.list({ limit: LIST_ALL }, h) },
          {
            queryKey: ["reports", "revenue-by-channel", from, to],
            queryFn: () => reportsService.revenueByChannel({ date_from: from, date_to: to }, h),
          },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <FinanceExpensesPage />
    </HydrationBoundary>
  );
}
