// ─────────────────────────────────────────────────────────────
// src/services/productLots.ts — ล็อตสินค้าที่ผลิตเสร็จ (/admin/product-lots) · ดู types/productLot.ts
// ล็อตถูกสร้างฝั่ง backend ตอนปิดงานผลิตเท่านั้น — ที่นี่มีแค่อ่าน (รายการ + ค้นจากเลขล็อตที่สแกน)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { ProductLot, ProductLotListParams } from "@/types/productLot";

const BASE = "/admin/product-lots";

export const productLotsService = {
  list: (params: ProductLotListParams = {}) => http.getList<ProductLot>(BASE, { params }),

  /** สแกนบาร์โค้ดบนฉลาก → ข้อมูลล็อต · ไม่พบ = 404 */
  getByNo: (lotNo: string) =>
    http.get<ItemResponse<ProductLot>>(`${BASE}/${encodeURIComponent(lotNo.trim())}`).then((r) => r.data),
};
