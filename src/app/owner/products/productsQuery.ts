// ─────────────────────────────────────────────────────────────
// productsQuery.ts — pure: ค่าเริ่มต้น + query key ของหน้ารายการสินค้า
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) → key ตรงกันเป๊ะ
// ต้องอยู่ไฟล์ที่ไม่มี "use client" — server เรียกฟังก์ชันจากไฟล์ client ไม่ได้
// ─────────────────────────────────────────────────────────────
import type { ProductKind } from "@/types/product";

export type SortValue = "-created_at" | "product_price" | "-product_price" | "-avg_rating";
export type TypeFilter = "all" | ProductKind;

export const PRODUCTS_DEFAULT_SORT: SortValue = "-created_at";
export const PRODUCTS_PAGE_SIZE = 12;
export const PRODUCT_CATEGORIES_KEY = ["product-categories"] as const;

export function productListParams(f: {
  search: string;
  categoryId: string | null;
  type: TypeFilter;
  sort: SortValue;
  page: number;
  pageSize: number;
}) {
  return {
    search: f.search.trim() || undefined,
    category_id: f.categoryId ?? undefined,
    is_preorder: f.type === "all" ? undefined : f.type === "preorder",
    sort: f.sort,
    page: f.page,
    limit: f.pageSize,
  };
}

/** params ของหน้าแรกเมื่อยังไม่กรองอะไร */
export const initialProductListParams = () =>
  productListParams({ search: "", categoryId: null, type: "all", sort: PRODUCTS_DEFAULT_SORT, page: 1, pageSize: PRODUCTS_PAGE_SIZE });
