import { HydrationBoundary } from "@tanstack/react-query";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { currentUserOnServer, serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import PricingPage from "./PricingPageClient";
import { PRICING_CATEGORIES_KEY, PRICING_PRODUCTS_KEY, PRICING_PRODUCTS_PARAMS } from "./pricingQuery";

// ตั้งราคาสินค้า — ดึงสินค้าทั้งหมด + หมวดหมู่ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน + ยิง API แล้ววาดทั้งหน้าใหม่ (Lighthouse มือถือ Performance 74 · TBT 610ms) ·
// query key ร่วมกับ ViewModel ที่ pricingQuery.ts · backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function PricingRoute() {
  const [user, h] = await Promise.all([currentUserOnServer(), serverHttpAsUser()]);
  const state = await prefetchPublic(
    user && h
      ? [
          { queryKey: [...PRICING_PRODUCTS_KEY], queryFn: () => productsService.list(PRICING_PRODUCTS_PARAMS, h) },
          { queryKey: [...PRICING_CATEGORIES_KEY], queryFn: () => productCategoriesService.list(h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <PricingPage />
    </HydrationBoundary>
  );
}
