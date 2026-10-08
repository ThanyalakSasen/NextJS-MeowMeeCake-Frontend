import { LIST_ALL } from "@/lib/http";
// query ที่หน้าแรกกับหน้าสินค้าทั้งหมดใช้ร่วมกัน — key เดียวกัน = ใช้ cache ร่วม ไม่ยิงซ้ำตอนสลับหน้า
// สินค้าปกติ (พร้อมขาย) เท่านั้น — พรีออเดอร์สั่งผ่านหน้าพรีออเดอร์ · backend clamp limit สูงสุด 100
export const CATALOG_PRODUCT_PARAMS = { is_preorder: false, limit: LIST_ALL } as const;
export const catalogProductsKey = ["catalog", "products", CATALOG_PRODUCT_PARAMS] as const;
export const catalogCategoriesKey = ["catalog", "categories"] as const;
/** หน้ารายละเอียดสินค้า (C1) — ตัวเลือก cache ร่วมกับ useAddToCart.quickAdd (บัตรสินค้าเช็คก่อนใส่ตะกร้า) */
export const catalogProductKey = (id: string) => ["catalog", "product", id] as const;
export const productCustomizationKey = (id: string) => ["catalog", "product", id, "customization"] as const;
/** ข้อมูลร้าน (ติดต่อเรา D8 · ค่าส่ง/โลโก้ D9) + หัวข้อฟอร์มติดต่อ */
export const storeInfoKey = ["catalog", "store-info"] as const;
export const contactTopicsKey = ["catalog", "contact-topics"] as const;
/** หน้าค่าจัดส่ง (D9) + โลโก้ร้าน (Navbar/Footer) */
export const shippingZonesKey = ["catalog", "shipping-zones"] as const;
export const storeLogoKey = ["catalog", "store-logo"] as const;
/** สินค้าแนะนำหน้าแรก (C2) — ต่อท้ายด้วยสถานะ login (ผลต่างกัน) */
export const homeRecommendationsKey = ["catalog", "recommended"] as const;
