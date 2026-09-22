// ─────────────────────────────────────────────────────────────
// src/constants/menuKeys.ts
// ค่าคงที่/ฟังก์ชัน pure เกี่ยวกับ menu_key — ใช้ทั้ง proxy.ts, Sidebar, PermissionsContext
// (port จาก lib/menuKeys.ts ของระบบเดิม — ไม่แตะ DB, ไม่มี side effect)
// ─────────────────────────────────────────────────────────────

// ต้องตรงกับ MENU_KEYS ของ backend (src/services/permissionService.ts) ทุกตัว — backend เช็คสิทธิ์ด้วย key เหล่านี้
export type MenuKey =
  | "dashboard" | "products" | "orders" | "preorder" | "payments" | "ingredients"
  | "stock" | "recipes" | "production" | "employees" | "promotions" | "reports";

export const ALL_MENU_KEYS: MenuKey[] = [
  "dashboard", "products", "orders", "preorder", "payments", "ingredients",
  "stock", "recipes", "production", "employees", "promotions", "reports",
];

/** สิทธิ์ 5 อย่างของ menu_key เดียว — ตรงกับ can_view/create/update/delete/approve ของ backend */
export interface MenuPermissionSet {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
}

export const FULL_MENU_ACCESS: MenuPermissionSet = {
  view: true, create: true, update: true, delete: true, approve: true,
};
export const NO_MENU_ACCESS: MenuPermissionSet = {
  view: false, create: false, update: false, delete: false, approve: false,
};

// map path → menu_key เรียงจาก prefix เจาะจงกว่าไว้ก่อน (longest-prefix match)
// path ที่ไม่อยู่ในนี้ (dashboard, store-design, notificationsHistory, attendance) = login พอ ไม่เช็ค can_view เพิ่ม
// — attendance = พนักงานที่ login เช็คอิน/เช็คเอาท์ของตัวเอง (ตั้งใจไม่ผูก menu_key ใด ๆ)
const ROUTE_MENU_MAP: { prefix: string; menuKey: MenuKey }[] = [
  { prefix: "/owner/ingredients/ingredientStock", menuKey: "stock" },
  { prefix: "/owner/ingredients/ingredientHistory", menuKey: "stock" },
  { prefix: "/owner/ingredients", menuKey: "ingredients" },
  { prefix: "/owner/products/productStock", menuKey: "stock" },
  { prefix: "/owner/products", menuKey: "products" },
  { prefix: "/owner/orders/preOrderRound", menuKey: "preorder" },
  { prefix: "/owner/orders", menuKey: "orders" },
  // ตั้งราคา/ราคาลดยิง /admin/products ตรง ๆ (ไม่มี endpoint "โปรโมชัน" แยก) ต้องผูกกับ "products"
  // ไม่ใช่ "promotions" ถึงจะตรงกับสิทธิ์จริงที่หน้าเช็ค (usePricingViewModel.ts) — ต้องมาก่อน
  // /owner/promotions ทั่วไปเพราะ resolveMenuKey() เลือก prefix ที่ยาวที่สุด (docs/BACKLOG.md §1)
  { prefix: "/owner/promotions/pricing", menuKey: "products" },
  { prefix: "/owner/promotions", menuKey: "promotions" },
  { prefix: "/owner/production", menuKey: "production" },
  { prefix: "/owner/recipes", menuKey: "recipes" },
  { prefix: "/owner/employees", menuKey: "employees" },
  // รีวิวลูกค้ายิง /admin/reviews ใต้ products.* (ดู useReviewsViewModel.ts) — เหตุผลเดียวกับ pricing
  // ข้างบน ต้องมาก่อน /owner/reports ทั่วไป (docs/BACKLOG.md §1)
  { prefix: "/owner/reports/reviews", menuKey: "products" },
  { prefix: "/owner/reports", menuKey: "reports" },
  { prefix: "/owner/finance", menuKey: "reports" },
];

export function resolveMenuKey(pathname: string): MenuKey | null {
  let best: { prefix: string; menuKey: MenuKey } | null = null;
  for (const entry of ROUTE_MENU_MAP) {
    if (pathname.startsWith(entry.prefix) && (!best || entry.prefix.length > best.prefix.length)) {
      best = entry;
    }
  }
  return best?.menuKey ?? null;
}

/** role_type ที่ข้าม permission ทั้งหมด (เจ้าของร้าน) — backend จริงมีแค่ owner/staff/customer
 *  ไม่มี "admin" เลย (เทียบ lowercase กันเผื่อ role_type มาจาก source อื่นที่ตัวพิมพ์ไม่ตรง) */
export function isUnrestrictedRole(roleType: string | undefined | null): boolean {
  return (roleType ?? "").toLowerCase() === "owner";
}
