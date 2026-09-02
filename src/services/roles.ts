import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { Role, RoleInput } from "@/types/role";

const BASE = "/roles";

export const rolesService = {
  list: () => http.get<ListResponse<Role>>(BASE, { params: { limit: 100 } }),
  create: (body: RoleInput) => http.post<ItemResponse<Role>>(BASE, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
