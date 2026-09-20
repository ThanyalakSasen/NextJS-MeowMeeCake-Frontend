// ─────────────────────────────────────────────────────────────
// salesReport.ts — pure: helper เฉพาะหน้า Sales Report (ไม่ผูก React)
// backend /admin/dashboard/top-products ให้แค่ product_id/ชื่อ/จำนวนขาย/ยอดขาย (ไม่มีกำไร/ต้นทุน/
// หมวดหมู่/แยกช่องทางออนไลน์-หน้าร้าน) — enrich หมวดหมู่ที่นี่โดย join กับ products list ที่โหลดแยกอยู่
// แล้ว (ไม่เพิ่ม request) ส่วนกำไร/ต้นทุน/ช่องทางตัดออกเพราะไม่มีข้อมูลจริงให้ใช้
// ─────────────────────────────────────────────────────────────
import type { Product } from "@/types/product";
import type { TopProductRow } from "@/services/reports";

export type SalesMode = "revenue" | "qty";
export type SortDir = "desc" | "asc";
export const CATEGORY_ALL = "all";

export interface ProductSalesRow {
  product_id: string;
  name: string;
  category_id: string;
  category_name: string;
}

export interface ProductSalesStat extends ProductSalesRow {
  qty: number;
  revenue: number;
}

function categoryOf(p: Product | undefined): { id: string; name: string } {
  const c = p?.category_id;
  if (c && typeof c === "object") return { id: c._id, name: c.product_category_name };
  return { id: "", name: "" };
}

/** join top-products (ไม่มีหมวดหมู่) กับ products list (มีหมวดหมู่ populate มาให้) */
export function enrichWithCategory(rows: TopProductRow[], products: Product[]): ProductSalesStat[] {
  const byId = new Map(products.map((p) => [p._id, p]));
  return rows.map((r) => {
    const { id, name } = categoryOf(byId.get(r.product_id));
    return {
      product_id: r.product_id,
      name: r.product_name,
      category_id: id,
      category_name: name,
      qty: r.quantity_sold,
      revenue: r.revenue,
    };
  });
}

export function valueOf(p: ProductSalesStat, mode: SalesMode): number {
  return mode === "revenue" ? p.revenue : p.qty;
}

// สีต่อหมวดหมู่ — hash ชื่อ id เป็น index วนใน palette คงที่ (แพทเทิร์นเดียวกับ paletteOf ใน BannerCard.tsx)
const PALETTE = ["#3b82f6", "#f59e0b", "#22c55e", "#ec4899", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16"];

export function colorForCategory(categoryId: string): string {
  if (!categoryId) return "#94a3b8";
  let h = 0;
  for (const c of categoryId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
