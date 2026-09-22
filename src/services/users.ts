// เรียก endpoint /users (docs/API_CONTRACT.md §3) — แพทเทิร์นเดียวกับ services/products.ts
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { AppUser, AppUserInput, CreateAppUserInput, UserListParams } from "@/types/user";

const BASE = "/admin/users";

export const usersService = {
  list: (params: UserListParams = {}) => http.getList<AppUser>(BASE, { params }),
  get: (id: string) => http.get<ItemResponse<AppUser>>(`${BASE}/${id}`),
  create: (body: CreateAppUserInput) => http.post<ItemResponse<AppUser>>(BASE, body),
  update: (id: string, body: Partial<AppUserInput>) => http.patch<ItemResponse<AppUser>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
