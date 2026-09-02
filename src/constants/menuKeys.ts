// ─────────────────────────────────────────────────────────────
// src/constants/menuKeys.ts
// ค่าคงที่/ฟังก์ชัน pure เกี่ยวกับ menu_key — ใช้ทั้ง proxy.ts, Sidebar, PermissionsContext
// (port จาก lib/menuKeys.ts ของระบบเดิม — ไม่แตะ DB, ไม่มี side effect)
// ─────────────────────────────────────────────────────────────

export type MenuKey =
  | "dashboard" | "products" | "orders" | "payments" | "ingredients"
  | "stock" | "recipes" | "production" | "employees" | "promotions" | "reports";

export const ALL_MENU_KEYS: MenuKey[] = [
  "dashboard", "products", "orders", "payments", "ingredients",
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
  { prefix: "/owner/orders", menuKey: "orders" },
  { prefix: "/owner/promotions", menuKey: "promotions" },
  { prefix: "/owner/production", menuKey: "production" },
  { prefix: "/owner/recipes", menuKey: "recipes" },
  { prefix: "/owner/employees", menuKey: "employees" },
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

/** role_type ที่ข้าม permission ทั้งหมด (เจ้าของร้าน/แอดมิน) — เทียบ lowercase */
export function isUnrestrictedRole(roleType: string | undefined | null): boolean {
  const t = (roleType ?? "").toLowerCase();
  return t === "admin" || t === "owner";
}
