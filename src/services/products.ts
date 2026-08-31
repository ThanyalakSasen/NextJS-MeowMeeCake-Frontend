// ─────────────────────────────────────────────────────────────
// src/services/products.ts
// เรียก endpoint /products (docs/API_CONTRACT.md §3)
//
// ★ นี่คือ "ตัวอย่าง reference" ของ service — resource อื่นสร้างแบบเดียวกัน:
//   1 ไฟล์ต่อ 1 resource · export object ที่มี list/get/create/update/remove
//   ห้ามใส่ logic ธุรกิจที่นี่ (แค่ map endpoint) · ViewModel เรียกผ่าน useQuery/useMutation
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { Product, ProductInput, ProductListParams } from "@/types/product";

const BASE = "/products";

export const productsService = {
  list: (params: ProductListParams = {}) =>
    http.get<ListResponse<Product>>(BASE, { params }),

  get: (id: string) =>
    http.get<ItemResponse<Product>>(`${BASE}/${id}`),

  create: (body: ProductInput) =>
    http.post<ItemResponse<Product>>(BASE, body),

  update: (id: string, body: Partial<ProductInput>) =>
    http.patch<ItemResponse<Product>>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    http.delete<EmptyResponse>(`${BASE}/${id}`),
};
