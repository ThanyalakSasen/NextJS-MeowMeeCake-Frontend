import { HydrationBoundary } from "@tanstack/react-query";
import { productsService } from "@/services/products";
import { unitsService } from "@/services/units";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import ProductionPage from "./ProductionPageClient";
import {
  PRODUCTION_ORDERS_KEY,
  PRODUCTION_PRODUCTS_KEY,
  PRODUCTION_PRODUCTS_PARAMS,
  PRODUCTION_UNITS_KEY,
  fetchProductionOrders,
} from "./productionQuery";

// การผลิต — ดึงใบสั่งผลิต + สินค้า/หน่วย (เติมชื่อรายการในใบ) ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// ทุกแท็บใช้ข้อมูลชุดเดียวกัน · เดิมเนื้อหาขึ้นหลัง JS ทำงาน + รอ API 7 ก้อน (Lighthouse มือถือ Performance 71 ·
// LCP 4.3 วิ · TBT 530ms) · key ร่วมกับ ViewModel ที่ productionQuery.ts · backend ช้า → browser ดึงเองเหมือนเดิม
export default async function ProductionRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...PRODUCTION_ORDERS_KEY], queryFn: () => fetchProductionOrders(h) },
          { queryKey: [...PRODUCTION_PRODUCTS_KEY], queryFn: () => productsService.list(PRODUCTION_PRODUCTS_PARAMS, h) },
          { queryKey: [...PRODUCTION_UNITS_KEY], queryFn: () => unitsService.list({}, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <ProductionPage />
    </HydrationBoundary>
  );
}
