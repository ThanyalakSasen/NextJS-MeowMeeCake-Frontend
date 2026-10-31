// เรียก endpoint /permissions (docs/API_CONTRACT.md §3) — แพทเทิร์นเดียวกับ services/products.ts
import { http, type HttpReader } from "@/lib/http";
import { refId } from "@/lib/refId";
import type { ItemResponse, EmptyResponse, ListResponse } from "@/types/api";
import type { Permission, PermissionInput, PermissionListParams, RolePermissionRow } from "@/types/permission";

const BASE = "/admin/permissions";

type Ref = { _id: string } | string | null | undefined;

/**
 * GET /admin/permissions populate role_id (role_name, role_type) และ granted_by (ชื่อผู้ให้สิทธิ์) เป็น object
 * → แปลงกลับเป็น id ตาม type Permission · เดิมไม่แปลง: หน้าจัดการสิทธิ์จับคู่แถวกับตำแหน่งไม่ได้เลย
 * (ทุกตำแหน่งขึ้น 0/5 · กดบันทึกแล้วสร้างแถวซ้ำ ได้ 409) และเพดานสิทธิ์ (usePermissionCeiling) นับผิด
 */
function toPermission(raw: Omit<Permission, "role_id" | "granted_by"> & { role_id: Ref; granted_by?: Ref }): Permission {
  return { ...raw, role_id: refId(raw.role_id), granted_by: raw.granted_by == null ? null : refId(raw.granted_by) };
}

export const permissionsService = {
  list: async (params: PermissionListParams = {}, h: HttpReader = http): Promise<ListResponse<Permission>> => {
    const res = await h.getList<Parameters<typeof toPermission>[0]>(BASE, { params });
    return { ...res, data: res.data.map(toPermission) };
  },
  create: (body: PermissionInput) => http.post<ItemResponse<Permission>>(BASE, body),
  update: (id: string, body: Partial<PermissionInput>) => http.patch<ItemResponse<Permission>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
  /** PUT /admin/permissions/role/{roleId} { rows } — สิทธิ์ทั้งบทบาทในคำขอเดียว (ตรวจทุกแถวก่อน แล้วเขียนรวด · flag ที่ไม่ส่ง/ไม่เปลี่ยน = ไม่แตะ) */
  saveRole: (roleId: string, rows: RolePermissionRow[]) =>
    http.put<ItemResponse<{ created: number; updated: number }>>(`${BASE}/role/${encodeURIComponent(roleId)}`, { rows }),
};
