// ─────────────────────────────────────────────────────────────
// src/services/productCustomization.ts — /admin/products/{id}/customization (กลุ่มตัวเลือก + ออปชันเสริม)
// GET (products.view) · PUT ทั้งชุด (products.update) — backend customer-backend-merge.md §8.3
// ─────────────────────────────────────────────────────────────
import { http, type HttpReader } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { ProductCustomization, ProductCustomizationInput } from "@/types/productCustomization";

const path = (productId: string) => `/admin/products/${productId}/customization`;

export const productCustomizationService = {
  /** h = http client (ค่าเริ่มต้น http ปกติ) — ฝั่ง server ส่ง withConfig(cookie + no-store) เข้ามา (products/[id]/edit/page.tsx) */
  get: async (productId: string, h: HttpReader = http): Promise<ProductCustomization> => {
    const res = await h.get<ItemResponse<ProductCustomization>>(path(productId));
    return { groups: res.data.groups ?? [], options: res.data.options ?? [] };
  },

  /** คืนชุดใหม่ที่บันทึกแล้ว (มี _id ครบ) — backend ตรวจทั้งชุดก่อนเขียน · ผิด = 400 พร้อมข้อความระบุลำดับ */
  save: async (productId: string, body: ProductCustomizationInput): Promise<ProductCustomization> => {
    const res = await http.put<ItemResponse<ProductCustomization>>(path(productId), body);
    return { groups: res.data.groups ?? [], options: res.data.options ?? [] };
  },
};
