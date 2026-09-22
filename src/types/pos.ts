// ─────────────────────────────────────────────────────────────
// src/types/pos.ts
// DTO ของ GET /admin/pos/scan — ดูโค้ดจริง productService.resolveScan() ฝั่ง backend
// ─────────────────────────────────────────────────────────────
import type { Product } from "@/types/product";

/** ยังไม่มีสินค้าไหนในระบบจริงใช้ variant เลย (0 แถวใน productvariants — ดู backend
 *  docs/BACKLOG2.md §9) จึงยังไม่มี types/service แยกของ variant — พอ type คร่าว ๆ ให้ตรงกับ
 *  field ที่ backend select() มาจริง (variant_name/variant_price/variant_stock/unit_id) */
export interface PosScanVariant {
  _id: string;
  variant_name: string;
  variant_price: number;
  variant_stock: number;
  unit_id?: string | { _id: string; unit_name: string; unit_abbr: string };
}

export interface PosScanResult {
  product: Product;
  current_price: number;
  stock: number | null;
  variants: PosScanVariant[];
}
