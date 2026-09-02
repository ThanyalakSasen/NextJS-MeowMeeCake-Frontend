// เรียก endpoint /permissions (docs/API_CONTRACT.md §3) — แพทเทิร์นเดียวกับ services/products.ts
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { Permission, PermissionInput, PermissionListParams } from "@/types/permission";

const BASE = "/permissions";

export const permissionsService = {
  list: (params: PermissionListParams = {}) => http.get<ListResponse<Permission>>(BASE, { params }),
  create: (body: PermissionInput) => http.post<ItemResponse<Permission>>(BASE, body),
  update: (id: string, body: Partial<PermissionInput>) => http.patch<ItemResponse<Permission>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
