import { http, LIST_ALL, type HttpReader } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Role, RoleInput } from "@/types/role";

const BASE = "/admin/roles";

export const rolesService = {
  list: (h: HttpReader = http) => h.getList<Role>(BASE, { params: { limit: LIST_ALL } }),
  create: (body: RoleInput) => http.post<ItemResponse<Role>>(BASE, body),
  /** PATCH /admin/roles/:id — แก้ชื่อได้ · เปลี่ยน role_type ไม่ได้ (400) · ชื่อซ้ำ = 409 · สิทธิ์ employees.update */
  rename: (id: string, role_name: string) => http.patch<ItemResponse<Role>>(`${BASE}/${id}`, { role_name }),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
