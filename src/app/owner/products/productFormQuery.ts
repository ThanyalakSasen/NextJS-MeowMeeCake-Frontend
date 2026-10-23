// ─────────────────────────────────────────────────────────────
// productFormQuery.ts — pure: query key/params ของหน้าเพิ่ม/แก้ไขสินค้า
// ใช้ร่วมกันระหว่าง ViewModel/ฟอร์ม (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
export { PRODUCT_CATEGORIES_KEY } from "./productsQuery";

/** หน่วยของสินค้า (ตัวเลือกในฟอร์ม) */
export const PRODUCT_UNITS_PARAMS = { usage_context: "Product" as const };
export const PRODUCT_UNITS_KEY = ["units", { usage: "Product" }] as const;

export const productKey = (id: string) => ["product", id] as const;
/** ตัวเลือกสินค้า (กลุ่มตัวเลือก + ออปชันเสริม) — POS ใช้ key เดียวกันแคชร่วมกัน */
export const customizationKey = (productId: string) => ["product-customization", productId] as const;
