import { HydrationBoundary } from "@tanstack/react-query";
import { shippingZonesService } from "@/services/shippingZones";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import ShippingZonesPage from "./ShippingZonesPageClient";
import { SHIPPING_ZONES_KEY } from "./shippingQuery";

// ค่าจัดส่งหน้าร้านออนไลน์ — ดึงโซนค่าจัดส่งฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมขึ้นวงหมุนจน JS ทำงาน + รอ API · key ร่วมกับ ViewModel ที่ shippingQuery.ts
export default async function ShippingZonesRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(h ? [{ queryKey: [...SHIPPING_ZONES_KEY], queryFn: () => shippingZonesService.list(h) }] : []);
  return (
    <HydrationBoundary state={state}>
      <ShippingZonesPage />
    </HydrationBoundary>
  );
}
