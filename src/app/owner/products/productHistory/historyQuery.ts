// query ของหน้าประวัติสต็อกสินค้า — ใช้ร่วมกันระหว่าง ViewModel กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
import type { ProductStockTxnType } from "@/constants/enumConfig";
import type { ProductStockHistoryParams } from "@/types/productStockTransaction";

export const HISTORY_PAGE_SIZE = 20;

export interface HistoryFilters {
  productId: string; // "all" = ทุกสินค้า
  type: "all" | ProductStockTxnType;
  dateFrom: string | null; // "YYYY-MM-DD"
  dateTo: string | null;
}

export const DEFAULT_HISTORY_FILTERS: HistoryFilters = { productId: "all", type: "all", dateFrom: null, dateTo: null };

export function historyParams(f: HistoryFilters, page: number, limit: number): ProductStockHistoryParams {
  return {
    page,
    limit,
    ...(f.productId !== "all" ? { product_id: f.productId } : {}),
    ...(f.type !== "all" ? { type: f.type } : {}),
    ...(f.dateFrom ? { date_from: f.dateFrom } : {}),
    ...(f.dateTo ? { date_to: f.dateTo } : {}),
  };
}

// ขึ้นต้นด้วย "products" — ปรับสต็อกที่หน้าสต็อกสินค้า (invalidate ["products"]) แล้วประวัติโหลดใหม่ด้วย
export const historyKey = (params: ProductStockHistoryParams) => ["products", "stock-history", params] as const;
