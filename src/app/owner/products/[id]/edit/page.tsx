import { HydrationBoundary } from "@tanstack/react-query";
import { productsService } from "@/services/products";
import { productCustomizationService } from "@/services/productCustomization";
import { productCategoriesService } from "@/services/productCategories";
import { unitsService } from "@/services/units";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import EditProductPage from "./EditProductPageClient";
import {
  PRODUCT_CATEGORIES_KEY, PRODUCT_UNITS_KEY, PRODUCT_UNITS_PARAMS, customizationKey, productKey,
} from "../../productFormQuery";

// แก้ไขสินค้า — ดึงสินค้า + ตัวเลือกสินค้า + หมวดหมู่ + หน่วย ฝั่ง server ด้วย cookie ของผู้ใช้ แล้วส่งฟอร์มที่กรอกค่าแล้ว
// มาใน HTML แรก · เดิมขึ้นวงหมุนจน JS ทำงาน + รอ API · key ร่วมกับ ViewModel ที่ productFormQuery.ts
// (path มี id → OwnerLayout เทียบด้วย SSR_PAGE_PATTERNS)
export default async function EditProductRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...productKey(id)], queryFn: () => productsService.get(id, h) },
          { queryKey: [...customizationKey(id)], queryFn: () => productCustomizationService.get(id, h) },
          { queryKey: [...PRODUCT_CATEGORIES_KEY], queryFn: () => productCategoriesService.list(h) },
          { queryKey: [...PRODUCT_UNITS_KEY], queryFn: () => unitsService.list(PRODUCT_UNITS_PARAMS, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <EditProductPage />
    </HydrationBoundary>
  );
}
