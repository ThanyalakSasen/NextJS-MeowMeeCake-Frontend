import { HydrationBoundary } from "@tanstack/react-query";
import { reportsService } from "@/services/reports";
import { currentUserOnServer, serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import DashboardPage from "./DashboardPageClient";

// แดชบอร์ด — ดึงข้อมูลฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมโหลดหลัง JS ทำงาน → ตาราง "ออเดอร์ล่าสุด" (LCP) ขึ้นช้า (Lighthouse มือถือ LCP 3.6 วิ)
// query key + scope ต้องตรงกับ useDashboardViewModel · backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function DashboardRoute() {
  const [user, h] = await Promise.all([currentUserOnServer(), serverHttpAsUser()]);
  const show = user
    ? { orders: !!user.menuAccess.orders?.view, ingredients: !!user.menuAccess.ingredients?.view, production: !!user.menuAccess.production?.view }
    : null;
  const state = await prefetchPublic(
    show && h ? [{ queryKey: ["reports", "dashboard", show], queryFn: () => reportsService.dashboard(show, h) }] : [],
  );
  return (
    <HydrationBoundary state={state}>
      <DashboardPage />
    </HydrationBoundary>
  );
}
