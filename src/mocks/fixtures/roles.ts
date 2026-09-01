// MOCK (D17)
import type { Role } from "@/types/role";

const T = "2026-08-01T00:00:00.000Z";

export const rolesFixture: Role[] = [
  { _id: "role_owner", role_name: "เจ้าของร้าน", role_type: "owner", created_at: T, updated_at: T },
  { _id: "role_manager", role_name: "ผู้จัดการร้าน", role_type: "admin", created_at: T, updated_at: T },
  { _id: "role_baker", role_name: "เบเกอร์", role_type: "staff", created_at: T, updated_at: T },
  { _id: "role_cashier", role_name: "แคชเชียร์", role_type: "staff", created_at: T, updated_at: T },
  { _id: "role_customer", role_name: "ลูกค้า", role_type: "customer", created_at: T, updated_at: T },
];
