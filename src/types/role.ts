export type RoleType = "owner" | "admin" | "staff" | "customer";

export interface Role {
  _id: string;
  role_name: string;
  role_type: RoleType;
  created_at: string;
  updated_at: string;
}
