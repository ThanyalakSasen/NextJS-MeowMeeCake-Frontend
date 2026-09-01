import { http } from "@/lib/http";
import type { ListResponse } from "@/types/api";
import type { Role } from "@/types/role";

export const rolesService = {
  list: () => http.get<ListResponse<Role>>("/roles", { params: { limit: 100 } }),
};
