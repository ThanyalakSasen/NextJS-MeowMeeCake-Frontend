import { HydrationBoundary } from "@tanstack/react-query";
import { deliveryZonesService } from "@/services/deliveryZones";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import DeliveryZonesPage from "./DeliveryZonesPageClient";
import { DELIVERY_FEE_OVERVIEW_KEY, DELIVERY_ZONES_KEY } from "./deliveryZonesQuery";

// โซนค่าจัดส่ง (หลังร้าน) — ดึงโซน + ค่าส่งที่ใช้อยู่จริงฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมขึ้นวงหมุนจน JS ทำงาน + รอ API · key ร่วมกับ ViewModel ที่ deliveryZonesQuery.ts
export default async function DeliveryZonesRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...DELIVERY_ZONES_KEY], queryFn: () => deliveryZonesService.list(h) },
          { queryKey: [...DELIVERY_FEE_OVERVIEW_KEY], queryFn: () => deliveryZonesService.overview(h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <DeliveryZonesPage />
    </HydrationBoundary>
  );
}
