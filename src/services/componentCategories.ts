import { http, LIST_ALL } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { ComponentCategory } from "@/types/componentCategory";

const BASE = "/admin/component-categories";

// CRUD หมวดหมู่ — backend มีครบ (crudRoutes) · ชื่อห้ามซ้ำกับหมวดที่ยังไม่ถูกลบ (docs/BACKLOG2.md §15.2 ข้อ 1)
export const componentCategoriesService = {
  list: () => http.getList<ComponentCategory>(BASE, { params: { limit: LIST_ALL } }),
  create: (body: { component_category_name: string }) => http.post<ItemResponse<ComponentCategory>>(BASE, body),
  update: (id: string, body: { component_category_name: string }) => http.patch<ItemResponse<ComponentCategory>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
