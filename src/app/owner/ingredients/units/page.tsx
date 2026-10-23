import { HydrationBoundary } from "@tanstack/react-query";
import { unitsService } from "@/services/units";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import UnitsPage from "./UnitsPageClient";
import { UNITS_KEY } from "../ingredientsQuery";

// หน่วยนับ — ดึงหน่วยทั้งหมดฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมหน้าเป็นวงหมุนจน JS ทำงาน + รอ API · key ร่วมกับ ViewModel ที่ ingredientsQuery.ts
export default async function UnitsRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(h ? [{ queryKey: [...UNITS_KEY], queryFn: () => unitsService.list({}, h) }] : []);
  return (
    <HydrationBoundary state={state}>
      <UnitsPage />
    </HydrationBoundary>
  );
}
