// ─────────────────────────────────────────────────────────────
// permissionGroups.ts — helper ล้วนของหน้าจัดการสิทธิ์
// จัดกลุ่ม menu_key ให้ตรงกับหมวดหมู่ใน Sidebar (constants/menu.ts)
// ─────────────────────────────────────────────────────────────
import type { MenuKey } from "@/constants/menuKeys";
import type { NavKey } from "@/i18n/keys";
import type { Permission } from "@/types/permission";

export const PERM_FIELDS = ["can_view", "can_create", "can_update", "can_delete", "can_approve"] as const;
export type PermField = (typeof PERM_FIELDS)[number];

export type SectionKey = Extract<NavKey, `section${string}`> | "sectionOther";

/**
 * เมนูหลักใน Sidebar 1 อัน — groupKey = ชื่อเมนูที่มีหน้าย่อย (null = เมนูเดี่ยว ไม่มีหน้าย่อย)
 * keys = สิทธิ์ของแต่ละหน้าย่อย (1 หน้า = 1 key · แยกตามหน้าย่อย 2026-10-21)
 */
export interface PermissionMenu {
  groupKey: NavKey | null;
  keys: MenuKey[];
}

// ลำดับและการจัดกลุ่มเหมือน Sidebar (constants/menu.ts) — "การชำระเงิน" ไม่มีหน้าของตัวเอง
// (ยืนยันสลิป / คืนเงินอยู่ในหน้าคำสั่งซื้อ และรอบพรีออเดอร์) จึงอยู่ใต้กลุ่มคำสั่งซื้อ
export const PERMISSION_GROUPS: { sectionKey: SectionKey; menus: PermissionMenu[] }[] = [
  {
    sectionKey: "sectionOverview",
    menus: [
      { groupKey: null, keys: ["dashboard"] },
      { groupKey: "reports", keys: ["reports_sales", "reports_reviews"] },
      { groupKey: "finance", keys: ["finance_expenses", "finance_summary"] },
    ],
  },
  {
    sectionKey: "sectionProductsOrders",
    menus: [
      { groupKey: "products", keys: ["products", "stock", "search_synonyms"] },
      { groupKey: "ordersManage", keys: ["orders", "preorder", "payments"] },
      { groupKey: null, keys: ["pos"] },
      { groupKey: "promotions", keys: ["pricing", "promotions"] },
    ],
  },
  {
    sectionKey: "sectionProductionIngredients",
    menus: [
      { groupKey: null, keys: ["production"] },
      { groupKey: "ingredients", keys: ["ingredients", "ingredient_stock", "ingredient_history", "units"] },
      { groupKey: null, keys: ["recipes"] },
    ],
  },
  {
    sectionKey: "sectionEmployees",
    menus: [{ groupKey: "employees", keys: ["employees", "permissions", "user_log"] }],
  },
  {
    sectionKey: "sectionStorefront",
    menus: [
      { groupKey: null, keys: ["store_design"] },
      { groupKey: null, keys: ["store_info"] },
      { groupKey: null, keys: ["shipping"] },
    ],
  },
];

/** key ทั้งหมดที่ตั้งได้ในหน้าจัดการสิทธิ์ (ไม่รวม "reports" ที่เลิกใช้) */
export const PERM_MENU_KEYS: MenuKey[] = PERMISSION_GROUPS.flatMap((g) => g.menus.flatMap((m) => m.keys));

/** 1 แถวของ matrix — id=null คือยังไม่เคยบันทึกใน DB (ค่าเริ่มต้นปิดหมด) */
export interface PermRow {
  id: string | null;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
}

export const EMPTY_PERM_ROW: Omit<PermRow, "id"> = {
  can_view: false, can_create: false, can_update: false, can_delete: false, can_approve: false,
};

export type RolePerms = Record<MenuKey, PermRow>;

export function emptyRolePerms(): RolePerms {
  const out = {} as RolePerms;
  for (const k of PERM_MENU_KEYS) out[k] = { id: null, ...EMPTY_PERM_ROW };
  return out;
}

/** รวม permission rows ของทุก role → { roleId: RolePerms } */
export function groupPermissions(roleIds: string[], perms: Permission[]): Record<string, RolePerms> {
  const byRole: Record<string, RolePerms> = {};
  for (const id of roleIds) byRole[id] = emptyRolePerms();
  for (const p of perms) {
    if (!byRole[p.role_id] || !PERM_MENU_KEYS.includes(p.menu_key)) continue;
    byRole[p.role_id][p.menu_key] = {
      id: p._id,
      can_view: p.can_view, can_create: p.can_create, can_update: p.can_update,
      can_delete: p.can_delete, can_approve: p.can_approve,
    };
  }
  return byRole;
}

export function countRow(row: PermRow): number {
  return PERM_FIELDS.reduce((n, f) => n + (row[f] ? 1 : 0), 0);
}

export function countAll(rows: RolePerms): { on: number; total: number } {
  let on = 0;
  for (const k of PERM_MENU_KEYS) on += countRow(rows[k]);
  return { on, total: PERM_MENU_KEYS.length * PERM_FIELDS.length };
}

export function rowHasAny(row: PermRow): boolean {
  return countRow(row) > 0;
}
