import { HydrationBoundary } from "@tanstack/react-query";
import { bannersService } from "@/services/banners";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import StoreDesignPage from "./StoreDesignPageClient";
import { BANNERS_KEY, BANNERS_PARAMS } from "./bannersQuery";

// ออกแบบร้านออนไลน์ — แบนเนอร์: ดึงรายการแบนเนอร์ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน + รอ API (Lighthouse มือถือ Performance 86 · LCP 4.0 วิ) · key ร่วมกับ ViewModel ที่ bannersQuery.ts
export default async function StoreDesignRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(h ? [{ queryKey: [...BANNERS_KEY], queryFn: () => bannersService.list(BANNERS_PARAMS, h) }] : []);
  return (
    <HydrationBoundary state={state}>
      <StoreDesignPage />
    </HydrationBoundary>
  );
}
