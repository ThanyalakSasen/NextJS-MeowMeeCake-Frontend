// ─────────────────────────────────────────────────────────────
// src/services/pos.ts
// เรียก endpoint /admin/pos/* (แยกจาก services/products.ts เพราะเป็นคนละ resource ฝั่ง backend
// แม้จะคืนข้อมูลสินค้าก็ตาม — ตามธรรมเนียม "1 ไฟล์ต่อ 1 resource")
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, ListResponse } from "@/types/api";
import type { PosGuestCustomer, PosProduct, PosProductListParams, PosScanResult } from "@/types/pos";
import { toProduct } from "@/services/products";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const posService = {
  /**
   * GET /admin/pos/products — สินค้าที่ขายหน้าร้านได้ (ไม่ลบ · ไม่ใช่พรีออเดอร์) ใต้สิทธิ์ orders.view
   * ใช้แทน /admin/products (ต้อง products.view ซึ่งพนักงานหน้าร้านอาจไม่มี — BACKLOG3 I15 · backend Q-BE10)
   */
  listProducts: async (params: PosProductListParams = {}): Promise<ListResponse<PosProduct>> => {
    const res = await http.getList<any>("/admin/pos/products", { params });
    return { ...res, data: res.data.map((raw) => ({ ...toProduct(raw), has_customization: raw.has_customization !== false })) };
    // ไม่มี flag (backend รุ่นก่อน) = ถือว่ามี → ไปดึงจาก /pos/scan ก่อนลงบิลเหมือนเดิม (ไม่ลงบิลข้ามกลุ่มบังคับ)
  },


  /**
   * GET /admin/pos/guest-customer — บัญชี "ลูกค้าทั่วไป" ที่ผูกกับออเดอร์หน้าร้านที่ไม่ระบุลูกค้า · สิทธิ์ orders.view
   * ใช้แทนการค้นผ่าน /admin/users (ต้อง employees.view — พนักงานเคาน์เตอร์ไม่ควรต้องเห็นรายชื่อพนักงาน
   * เพื่อจะขายของได้ · backend `src/lib/posGuest.ts`) · ยังไม่ได้ seed = 404
   */
  guestCustomer: async (): Promise<PosGuestCustomer> => {
    const res = await http.get<ItemResponse<PosGuestCustomer>>("/admin/pos/guest-customer");
    return res.data;
  },

  /**
   * GET /admin/pos/scan?code=<รหัสสินค้า | _id> — ใช้ตอนยิงบาร์โค้ดหน้าร้าน (POS)
   * code รับได้ทั้ง product_id (เช่น "pos-0126264") หรือ _id ดิบ — backend โยน 400/404 ถ้าไม่พบ/รูปแบบผิด
   */
  scan: async (code: string): Promise<PosScanResult> => {
    const res = await http.get<ItemResponse<any>>("/admin/pos/scan", { params: { code } });
    return {
      ...res.data,
      product: toProduct(res.data.product),
      customization: {
        groups: res.data.customization?.groups ?? [],
        options: res.data.customization?.options ?? [],
      },
    };
  },
};
