// ─────────────────────────────────────────────────────────────
// src/services/products.ts
// เรียก endpoint /admin/products (productModel.ts จริงฝั่ง backend)
//
// ★ นี่คือ "ตัวอย่าง reference" ของ service — resource อื่นสร้างแบบเดียวกัน:
//   1 ไฟล์ต่อ 1 resource · export object ที่มี list/get/create/update/remove
//   ห้ามใส่ logic ธุรกิจที่นี่ (แค่ map endpoint) · ViewModel เรียกผ่าน useQuery/useMutation
//
// 2 จุดที่ต้อง normalize ทุกครั้งที่อ่าน:
//  1) avg_rating — backend เก็บเป็น Mongoose Decimal128 คืนมาเป็น { $numberDecimal: "4.8" } ไม่ใช่
//     number ตรง ๆ (RatingDisplay เรียก .toFixed() ตรง ๆ จะพังทันทีถ้าไม่แปลงก่อน)
//  2) is_preorder — backend #52 เปลี่ยนจาก product_type (string) / product_types (array) เป็น boolean
//     ถ้า response ยังเป็นรุ่นเก่า (backend ยังไม่ deploy / เอกสารที่ยังไม่ migrate) derive จากฟิลด์เดิมให้
//     ที่นี่จุดเดียว — ที่เหลือของแอปอ่านแค่ is_preorder
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Product, ProductInput, ProductListParams } from "@/types/product";

const BASE = "/admin/products";

/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeIsPreorder(raw: any): boolean {
  if (typeof raw.is_preorder === "boolean") return raw.is_preorder;
  if (Array.isArray(raw.product_types)) return raw.product_types.includes("preorder"); // รุ่น 2026-09-24
  return raw.product_type === "preorder"; // รุ่นแรก
}

function normalizeRating(raw: any): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number") return raw;
  if (typeof raw === "object" && "$numberDecimal" in raw) return Number(raw.$numberDecimal);
  return Number(raw) || 0;
}

/** export ไว้ให้ services/pos.ts เรียกซ้ำได้ — resolveScan() (backend) คืน product shape เดียวกับ
 *  list/get เป๊ะ (presentProduct() ใช้ร่วมกันฝั่ง backend) จึงต้อง normalize เหมือนกันทุกจุด */
export function toProduct(raw: any): Product {
  // ตัดฟิลด์ประเภทรุ่นเก่าทิ้ง — กันหลุดกลับไปใน body ของ PATCH แล้วโดน 400
  const rest = { ...raw };
  delete rest.product_type;
  delete rest.product_types;
  return {
    ...rest,
    is_preorder: normalizeIsPreorder(raw),
    avg_rating: normalizeRating(raw.avg_rating),
  };
}

export const productsService = {
  list: async (params: ProductListParams = {}) => {
    const res = await http.getList<any>(BASE, { params });
    return { ...res, data: res.data.map(toProduct) };
  },

  get: async (id: string) => {
    const res = await http.get<ItemResponse<any>>(`${BASE}/${id}`);
    return { data: toProduct(res.data) };
  },

  create: (body: ProductInput) =>
    http.post<ItemResponse<Product>>(BASE, body),

  update: (id: string, body: Partial<ProductInput>) =>
    http.patch<ItemResponse<Product>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),

  /**
   * POST /admin/products/images — อัปโหลดไฟล์รูปจริง (multipart) คืน URL จริงที่ต้องเอาไปใส่
   * field product_img ตอน create/update (ห้ามส่ง base64 ตรง ๆ — ไม่ใช่ shape ที่ backend รับ)
   */
  uploadImages: async (files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const res = await http.post<ItemResponse<{ urls: string[] }>>(`${BASE}/images`, form);
    return res.data.urls;
  },
};
