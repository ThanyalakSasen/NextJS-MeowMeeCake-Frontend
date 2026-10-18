import { HydrationBoundary } from "@tanstack/react-query";
import { reportsService } from "@/services/reports";
import { productsService } from "@/services/products";
import { LIST_ALL } from "@/lib/http";
import { currentUserOnServer, serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import { bangkokMonthRangeIso } from "@/utils/period";
import SalesReportPage from "./SalesReportPageClient";

// รายงานยอดขาย — ดึงข้อมูลเดือนนี้ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมโหลดหลัง JS ทำงาน → การ์ดสรุป (LCP) ขึ้นช้า (Lighthouse มือถือ LCP 3.6 วิ)
// query key ต้องตรงกับ useSalesReportViewModel — ค่าเริ่มต้น = รายเดือน เดือนปัจจุบัน ตามเวลาไทย
// (server เป็น UTC · browser ในไทยคำนวณ dayjs().startOf("month") เป็นเวลาไทย) · ไม่ตรง/ช้า → browser ดึงเองเหมือนเดิม
export default async function SalesReportRoute() {
  const [user, h] = await Promise.all([currentUserOnServer(), serverHttpAsUser()]);
  const [from, to] = bangkokMonthRangeIso();
  const state = await prefetchPublic(
    user && h
      ? [
          {
            queryKey: ["dashboard", "top-products", from, to],
            queryFn: () => reportsService.topProducts({ limit: 50, date_from: from, date_to: to }, h),
          },
          { queryKey: ["products"], queryFn: () => productsService.list({ limit: LIST_ALL }, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <SalesReportPage />
    </HydrationBoundary>
  );
}
