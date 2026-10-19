// ─────────────────────────────────────────────────────────────
// pricingQuery.ts — pure: query key/params ของหน้าตั้งราคาสินค้า
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

export const PRICING_PRODUCTS_PARAMS = { limit: LIST_ALL };
export const PRICING_PRODUCTS_KEY = ["products", PRICING_PRODUCTS_PARAMS] as const;
export const PRICING_CATEGORIES_KEY = ["product-categories"] as const;
