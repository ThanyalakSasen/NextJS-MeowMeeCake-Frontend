import { HydrationBoundary } from "@tanstack/react-query";
import { promotionsService } from "@/services/promotions";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import CouponsPage from "./CouponsPageClient";
import { COUPONS_KEY, COUPONS_PARAMS } from "./couponsQuery";

// คูปอง/ส่วนลด — ดึงรายการโปรโมชันฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน + รอ API 3 ก้อน (Lighthouse มือถือ Performance 72 · LCP 4.6 วิ) ·
// query key ร่วมกับ ViewModel ที่ couponsQuery.ts · backend ช้า → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function CouponsRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h ? [{ queryKey: [...COUPONS_KEY], queryFn: () => promotionsService.list(COUPONS_PARAMS, h) }] : [],
  );
  return (
    <HydrationBoundary state={state}>
      <CouponsPage />
    </HydrationBoundary>
  );
}
