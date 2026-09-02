// MOCK (D17) — สิทธิ์ต่อ (role × menu_key)
// role_owner / role_manager = ข้ามการเช็ค (owner/admin) แต่ seed ไว้ให้เห็นในหน้าจัดการสิทธิ์
// role_customer ไม่ seed (ไม่ใช่พนักงาน)
import type { Permission } from "@/types/permission";

const T = "2026-08-01T00:00:00.000Z";
let n = 0;
const row = (
  role_id: string,
  menu_key: Permission["menu_key"],
  p: Partial<Pick<Permission, "can_view" | "can_create" | "can_update" | "can_delete" | "can_approve">>,
): Permission => ({
  _id: `perm_${++n}`,
  role_id,
  menu_key,
  can_view: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_approve: false,
  ...p,
  expires_at: null,
  granted_by: "u_owner",
  created_at: T,
  updated_at: T,
});

export const permissionsFixture: Permission[] = [
  // ── เบเกอร์ (staff) — งานผลิต + สูตร + ดูวัตถุดิบ/สต็อก ──
  row("role_baker", "production", { can_view: true, can_create: true, can_update: true }),
  row("role_baker", "recipes", { can_view: true, can_create: true, can_update: true }),
  row("role_baker", "ingredients", { can_view: true }),
  row("role_baker", "stock", { can_view: true, can_create: true, can_update: true }),

  // ── แคชเชียร์ (staff) — คำสั่งซื้อ + ยืนยันชำระเงิน + ดูสินค้า ──
  row("role_cashier", "orders", { can_view: true, can_create: true, can_update: true }),
  row("role_cashier", "payments", { can_view: true, can_approve: true }),
  row("role_cashier", "products", { can_view: true }),

  // ── ผู้จัดการร้าน (admin — ข้ามเช็คจริง แต่ seed ให้เห็น) ──
  row("role_manager", "products", { can_view: true, can_create: true, can_update: true, can_delete: true }),
  row("role_manager", "orders", { can_view: true, can_create: true, can_update: true, can_delete: true }),
  row("role_manager", "payments", { can_view: true, can_approve: true }),
  row("role_manager", "reports", { can_view: true }),
  row("role_manager", "employees", { can_view: true, can_update: true }),
];
