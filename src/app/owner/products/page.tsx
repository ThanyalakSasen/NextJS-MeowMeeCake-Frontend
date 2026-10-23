import { HydrationBoundary } from "@tanstack/react-query";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import ProductsPage from "./ProductsPageClient";
import { initialProductListParams, PRODUCT_CATEGORIES_KEY } from "./productsQuery";

// จัดการสินค้า — ดึงสินค้าหน้าแรก (ยังไม่กรอง) + หมวดหมู่ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน + ยิง API (Lighthouse มือถือ Performance 64) · query key ร่วมกับ ViewModel ที่ productsQuery.ts ·
// backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function ProductsRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me (เดิมรอต่อกัน 2 ทอดไป backend) · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const params = initialProductListParams();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: ["products", params], queryFn: () => productsService.list(params, h) },
          { queryKey: [...PRODUCT_CATEGORIES_KEY], queryFn: () => productCategoriesService.list(h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <ProductsPage />
    </HydrationBoundary>
  );
}
