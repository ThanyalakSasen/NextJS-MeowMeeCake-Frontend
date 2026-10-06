import { LIST_ALL } from "@/lib/http";
// query ที่หน้าแรกกับหน้าสินค้าทั้งหมดใช้ร่วมกัน — key เดียวกัน = ใช้ cache ร่วม ไม่ยิงซ้ำตอนสลับหน้า
// สินค้าปกติ (พร้อมขาย) เท่านั้น — พรีออเดอร์สั่งผ่านหน้าพรีออเดอร์ · backend clamp limit สูงสุด 100
export const CATALOG_PRODUCT_PARAMS = { is_preorder: false, limit: LIST_ALL } as const;
export const catalogProductsKey = ["catalog", "products", CATALOG_PRODUCT_PARAMS] as const;
export const catalogCategoriesKey = ["catalog", "categories"] as const;
