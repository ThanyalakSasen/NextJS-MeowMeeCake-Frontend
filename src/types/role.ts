// ตรงกับ backend จริง (schemas/rbac.ts ROLE_TYPES / models/roleModel.ts) — ไม่มี "admin"
export type RoleType = "owner" | "staff" | "customer";

export interface Role {
  _id: string;
  role_name: string;
  role_type: RoleType;
  created_at: string;
  updated_at: string;
}

export type RoleInput = Pick<Role, "role_name" | "role_type">;
