import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { ProductCategory } from "@/types/productCategory";

const BASE = "/admin/product-categories";

// CRUD หมวดหมู่ — backend มีครบ (crudRoutes) · ชื่อห้ามซ้ำกับหมวดที่ยังไม่ถูกลบ (docs/BACKLOG2.md §15.2 ข้อ 1)
export const productCategoriesService = {
  list: () => http.getList<ProductCategory>(BASE, { params: { limit: 100 } }),
  create: (body: { product_category_name: string }) => http.post<ItemResponse<ProductCategory>>(BASE, body),
  update: (id: string, body: { product_category_name: string }) => http.patch<ItemResponse<ProductCategory>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
