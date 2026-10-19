// เรียก endpoint /users (docs/API_CONTRACT.md §3) — แพทเทิร์นเดียวกับ services/products.ts
import { http, type HttpReader } from "@/lib/http";
import { refId } from "@/lib/refId";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { AppUser, AppUserInput, CreateAppUserInput, UserListParams } from "@/types/user";

const BASE = "/admin/users";

/**
 * backend populate role_id เป็น { _id, role_name, role_type } ทั้ง list และ get (userService.listUsers/getUserById)
 * → แปลงกลับเป็น string id ตาม AppUser · เดิมส่ง object ต่อไปตรง ๆ: ตารางพนักงานหาชื่อตำแหน่งไม่เจอ ("—")
 * และ dropdown ตำแหน่งในฟอร์มแก้ไขได้ค่าเริ่มต้นเป็น object (แก้ตำแหน่งแล้วดูเหมือนไม่เปลี่ยน)
 */
function normalize(u: AppUser): AppUser {
  const role = u.role_id as unknown as { _id: string } | string | null | undefined;
  return { ...u, role_id: role ? refId(role) : null };
}

export const usersService = {
  /** h = http client (ค่าเริ่มต้น http ปกติ) — ฝั่ง server ส่ง withConfig(cookie + no-store) เข้ามา (employees/page.tsx) */
  list: async (params: UserListParams = {}, h: HttpReader = http) => {
    const res = await h.getList<AppUser>(BASE, { params });
    return { ...res, data: res.data.map(normalize) };
  },
  get: async (id: string) => {
    const res = await http.get<ItemResponse<AppUser>>(`${BASE}/${id}`);
    return { ...res, data: normalize(res.data) };
  },
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
