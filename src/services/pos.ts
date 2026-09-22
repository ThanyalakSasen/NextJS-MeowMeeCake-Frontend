// ─────────────────────────────────────────────────────────────
// src/services/pos.ts
// เรียก endpoint /admin/pos/* (แยกจาก services/products.ts เพราะเป็นคนละ resource ฝั่ง backend
// แม้จะคืนข้อมูลสินค้าก็ตาม — ตามธรรมเนียม "1 ไฟล์ต่อ 1 resource")
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { PosScanResult } from "@/types/pos";
import { toProduct } from "@/services/products";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const posService = {
  /**
   * GET /admin/pos/scan?code=<รหัสสินค้า | _id> — ใช้ตอนยิงบาร์โค้ดหน้าร้าน (POS)
   * code รับได้ทั้ง product_id (เช่น "pos-0126264") หรือ _id ดิบ — backend โยน 400/404 ถ้าไม่พบ/รูปแบบผิด
   */
  scan: async (code: string): Promise<PosScanResult> => {
    const res = await http.get<ItemResponse<any>>("/admin/pos/scan", { params: { code } });
    return { ...res.data, product: toProduct(res.data.product) };
  },
};
