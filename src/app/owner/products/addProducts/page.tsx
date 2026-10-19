import { HydrationBoundary } from "@tanstack/react-query";
import { productCategoriesService } from "@/services/productCategories";
import { unitsService } from "@/services/units";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import AddProductPage from "./AddProductPageClient";
import { PRODUCT_CATEGORIES_KEY, PRODUCT_UNITS_KEY, PRODUCT_UNITS_PARAMS } from "../productFormQuery";

// เพิ่มสินค้า — ดึงหมวดหมู่ + หน่วย (ตัวเลือกในฟอร์ม) ฝั่ง server ด้วย cookie ของผู้ใช้ แล้วส่งฟอร์มมาใน HTML แรก
// เดิมฟอร์มขึ้นหลัง JS ทำงาน · key ร่วมกับ ProductFormFields ที่ productFormQuery.ts
export default async function AddProductRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...PRODUCT_CATEGORIES_KEY], queryFn: () => productCategoriesService.list(h) },
          { queryKey: [...PRODUCT_UNITS_KEY], queryFn: () => unitsService.list(PRODUCT_UNITS_PARAMS, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <AddProductPage />
    </HydrationBoundary>
  );
}
