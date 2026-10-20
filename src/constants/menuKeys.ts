// ─────────────────────────────────────────────────────────────
// src/constants/menuKeys.ts
// ค่าคงที่/ฟังก์ชัน pure เกี่ยวกับ menu_key — ใช้ทั้ง proxy.ts, Sidebar, PermissionsContext
// (port จาก lib/menuKeys.ts ของระบบเดิม — ไม่แตะ DB, ไม่มี side effect)
// ─────────────────────────────────────────────────────────────

// ต้องตรงกับ MENU_KEYS ของ backend (src/lib/menuKeys.ts) ทุกตัว — backend เช็คสิทธิ์ด้วย key เหล่านี้
// แยกตามหน้าย่อยใน Sidebar (2026-10-21): 1 หน้า = 1 key · key ที่ API หลายหน้าใช้ร่วม backend ยอมรับได้หลาย key
// "reports" เลิกใช้แล้ว (แตกเป็น reports_sales / reports_reviews / finance_expenses / finance_summary) — มีไว้ให้ type ของแถวเก่า
export type MenuKey =
  | "dashboard"
  | "reports_sales" | "reports_reviews" | "finance_expenses" | "finance_summary"
  | "products" | "stock" | "search_synonyms"
  | "orders" | "preorder" | "pos" | "payments"
  | "pricing" | "promotions"
  | "production" | "ingredients" | "ingredient_stock" | "ingredient_history" | "units" | "recipes"
  | "employees" | "permissions" | "user_log"
  | "store_design" | "store_info" | "shipping"
  | "reports";

export const ALL_MENU_KEYS: MenuKey[] = [
  "dashboard",
  "reports_sales", "reports_reviews", "finance_expenses", "finance_summary",
  "products", "stock", "search_synonyms",
  "orders", "preorder", "pos", "payments",
  "pricing", "promotions",
  "production", "ingredients", "ingredient_stock", "ingredient_history", "units", "recipes",
  "employees", "permissions", "user_log",
  "store_design", "store_info", "shipping",
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
// path ที่ไม่อยู่ในนี้ (notificationsHistory) = login พอ ไม่เช็ค can_view เพิ่ม
// 1 หน้าใน Sidebar = 1 key (แยกตามหน้าย่อย 2026-10-21) — ต้องตรงกับ menuKey ใน constants/menu.ts
const ROUTE_MENU_MAP: { prefix: string; menuKey: MenuKey }[] = [
  // แดชบอร์ด = หน้าแรกหลังล็อกอิน — ไม่มี dashboard.view แล้ว OwnerLayout พาไปหน้าแรกที่มีสิทธิ์
  // (lib/landingPath.ts) แทนหน้า access-denied (Final-Backlog P11)
  { prefix: "/owner/dashboard", menuKey: "dashboard" },
  { prefix: "/owner/reports/sales", menuKey: "reports_sales" },
  // รวมหน้าตั้งค่ารีวิว (/owner/reports/reviews/settings) และลิงก์เก่า /reviews/dashboard
  { prefix: "/owner/reports/reviews", menuKey: "reports_reviews" },
  { prefix: "/owner/finance/expenses", menuKey: "finance_expenses" },
  { prefix: "/owner/finance/summary", menuKey: "finance_summary" },
  { prefix: "/owner/products/productStock", menuKey: "stock" },
  { prefix: "/owner/products/search-synonyms", menuKey: "search_synonyms" },
  { prefix: "/owner/products", menuKey: "products" },
  { prefix: "/owner/orders/preOrderRound", menuKey: "preorder" },
  { prefix: "/owner/orders/OrderInStore", menuKey: "pos" },
  { prefix: "/owner/orders", menuKey: "orders" },
  { prefix: "/owner/promotions/pricing", menuKey: "pricing" },
  { prefix: "/owner/promotions", menuKey: "promotions" },
  { prefix: "/owner/production", menuKey: "production" },
  { prefix: "/owner/ingredients/ingredientStock", menuKey: "ingredient_stock" },
  { prefix: "/owner/ingredients/ingredientHistory", menuKey: "ingredient_history" },
  { prefix: "/owner/ingredients/units", menuKey: "units" },
  { prefix: "/owner/ingredients", menuKey: "ingredients" },
  { prefix: "/owner/recipes", menuKey: "recipes" },
  { prefix: "/owner/employees/permissions", menuKey: "permissions" },
  { prefix: "/owner/employees/userLog", menuKey: "user_log" },
  { prefix: "/owner/employees", menuKey: "employees" },
  { prefix: "/owner/store-design", menuKey: "store_design" },
  { prefix: "/owner/store-info", menuKey: "store_info" },
  { prefix: "/owner/shipping", menuKey: "shipping" },
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
