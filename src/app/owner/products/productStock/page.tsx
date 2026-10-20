import { HydrationBoundary } from "@tanstack/react-query";
import { productsService } from "@/services/products";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import ProductStockPage from "./ProductStockPageClient";
import { STOCK_LIST_KEY, STOCK_PARAMS } from "./stockQuery";

// สต็อกสินค้า — ดึงรายการสต็อกฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงานแล้วค่อยยิง API (Lighthouse มือถือ LCP 4.1 วิ) · key ร่วมกับ ViewModel ที่ stockQuery.ts ·
// backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function ProductStockRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me (เดิมรอต่อกัน 2 ทอดไป backend) · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h ? [{ queryKey: [...STOCK_LIST_KEY], queryFn: () => productsService.stockList(STOCK_PARAMS, h) }] : [],
  );
  return (
    <HydrationBoundary state={state}>
      <ProductStockPage />
    </HydrationBoundary>
  );
}
