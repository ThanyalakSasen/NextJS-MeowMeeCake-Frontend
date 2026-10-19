import { HydrationBoundary } from "@tanstack/react-query";
import { ordersService } from "@/services/orders";
import { LIST_ALL } from "@/lib/http";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import ManageOrdersPage from "./ManageOrdersPageClient";
import { ORDERS_KEY } from "./ordersQuery";

// จัดการคำสั่งซื้อ — ดึงออเดอร์ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน แล้วค่อยยิง API (ตารางออเดอร์ = LCP) · key ร่วมกับ ViewModel ที่ ordersQuery.ts ·
// backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function ManageOrdersRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me (เดิมรอต่อกัน 2 ทอดไป backend) · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h ? [{ queryKey: [...ORDERS_KEY], queryFn: () => ordersService.list({ limit: LIST_ALL }, h) }] : [],
  );
  return (
    <HydrationBoundary state={state}>
      <ManageOrdersPage />
    </HydrationBoundary>
  );
}
