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
  /** PUT /admin/users/{id}/password — เจ้าของร้านตั้งรหัสผ่านใหม่ให้ (ไม่ต้องรู้รหัสเดิม · ปลดล็อกบัญชีด้วย)
   *  สิทธิ์ employees.update · backend บังคับยาวอย่างน้อย MIN_PASSWORD_LENGTH ตัว */
  setPassword: (id: string, newPassword: string) =>
    http.put<ItemResponse<AppUser>>(`${BASE}/${id}/password`, { new_password: newPassword }),
  /** POST /admin/users/{id}/unlock — ปลดล็อกบัญชีที่ login ผิดหลายครั้ง (รีเซ็ตตัวนับ) · สิทธิ์ employees.update */
  unlock: (id: string) => http.post<ItemResponse<AppUser>>(`${BASE}/${id}/unlock`),
};
