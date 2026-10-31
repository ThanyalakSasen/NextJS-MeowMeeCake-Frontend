// ─────────────────────────────────────────────────────────────
// src/types/permission.ts — DTO ของ /permissions (docs/API_CONTRACT.md §3)
// 1 แถว = สิทธิ์ของ (role_id × menu_key) · owner ข้ามการเช็ค (ดู isUnrestrictedRole)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { MenuKey } from "@/constants/menuKeys";

export interface Permission {
  _id: string;
  role_id: string;
  menu_key: MenuKey;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
  expires_at?: string | null;
  granted_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type PermissionInput = Omit<Permission, "_id" | "created_at" | "updated_at">;

/** 1 เมนูใน PUT /admin/permissions/role/{roleId} — flag ที่ไม่ส่ง = คงเดิม */
export type RolePermissionRow = { menu_key: MenuKey } & Partial<
  Pick<Permission, "can_view" | "can_create" | "can_update" | "can_delete" | "can_approve">
>;

export interface PermissionListParams extends ListParams {
  role_id?: string;
}
