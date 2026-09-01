// ─────────────────────────────────────────────────────────────
// src/constants/menu.ts
// โครงเมนู Sidebar — label เป็น key ของ i18n namespace "nav" (ไม่ใช่ข้อความตรง ๆ)
// menuKey ไม่ระบุ = แสดงเสมอ (ตราบใด login) · ระบุ = กรองด้วย usePermission(menuKey).view
// ─────────────────────────────────────────────────────────────
import type { MenuKey } from "@/constants/menuKeys";
import type { NavKey } from "@/i18n/keys";

export interface MenuLeaf {
  labelKey: NavKey; // key ใน messages.*.nav (typescript เช็คว่ามีจริง)
  href: string;
  /** heroicon name (solid) ที่สื่อถึงหัวข้อ — resolve ผ่าน MENU_ICONS (shared/layout/menuIcons.ts) */
  icon: string;
  menuKey?: MenuKey;
}

export interface MenuNode {
  labelKey: NavKey;
  /** heroicon name — resolve ผ่าน MENU_ICONS */
  icon: string;
  href?: string;
  menuKey?: MenuKey;
  children?: MenuLeaf[];
}

export interface MenuSection {
  labelKey: NavKey;
  items: MenuNode[];
}

export const MENU_SECTIONS: MenuSection[] = [
  {
    labelKey: "sectionOverview",
    items: [
      {
        labelKey: "reports",
        icon: "PresentationChartBarIcon",
        children: [
          { labelKey: "reportsSales", href: "/owner/reports/sales", icon: "ArrowTrendingUpIcon", menuKey: "reports" },
          { labelKey: "reportsReviews", href: "/owner/reports/reviews", icon: "ChatBubbleLeftRightIcon", menuKey: "reports" },
        ],
      },
      {
        labelKey: "finance",
        icon: "CurrencyDollarIcon",
        children: [
          { labelKey: "financeExpenses", href: "/owner/finance/expenses", icon: "ReceiptPercentIcon", menuKey: "reports" },
          { labelKey: "financeSummary", href: "/owner/finance/summary", icon: "ChartPieIcon", menuKey: "reports" },
        ],
      },
    ],
  },
  {
    labelKey: "sectionProductsOrders",
    items: [
      { labelKey: "products", icon: "ShoppingBagIcon", href: "/owner/products", menuKey: "products" },
      { labelKey: "ordersManage", icon: "ClipboardDocumentListIcon", href: "/owner/orders/manageOrders", menuKey: "orders" },
      { labelKey: "ordersInStore", icon: "BuildingStorefrontIcon", href: "/owner/orders/OrderInStore", menuKey: "orders" },
      {
        labelKey: "promotions",
        icon: "TagIcon",
        children: [
          { labelKey: "promotionsPricing", href: "/owner/promotions/pricing", icon: "CurrencyDollarIcon", menuKey: "promotions" },
          { labelKey: "promotionsCoupons", href: "/owner/promotions/coupons", icon: "TicketIcon", menuKey: "promotions" },
        ],
      },
    ],
  },
  {
    labelKey: "sectionProductionIngredients",
    items: [
      { labelKey: "production", icon: "WrenchScrewdriverIcon", href: "/owner/production", menuKey: "production" },
      {
        labelKey: "ingredients",
        icon: "BeakerIcon",
        children: [
          { labelKey: "ingredients", href: "/owner/ingredients", icon: "CubeIcon", menuKey: "ingredients" },
          { labelKey: "ingredientStock", href: "/owner/ingredients/ingredientStock", icon: "ArchiveBoxIcon", menuKey: "stock" },
          { labelKey: "ingredientHistory", href: "/owner/ingredients/ingredientHistory", icon: "ArrowsRightLeftIcon", menuKey: "stock" },
          { labelKey: "units", href: "/owner/ingredients/units", icon: "ScaleIcon", menuKey: "ingredients" },
        ],
      },
      { labelKey: "recipes", icon: "BookOpenIcon", href: "/owner/recipes", menuKey: "recipes" },
    ],
  },
  {
    labelKey: "sectionEmployees",
    items: [
      {
        labelKey: "employees",
        icon: "UserGroupIcon",
        children: [
          { labelKey: "employees", href: "/owner/employees", icon: "UsersIcon", menuKey: "employees" },
          { labelKey: "permissions", href: "/owner/employees/permissions", icon: "ShieldCheckIcon", menuKey: "employees" },
          { labelKey: "userLog", href: "/owner/employees/userLog", icon: "ClipboardDocumentListIcon", menuKey: "employees" },
        ],
      },
      { labelKey: "storeDesign", icon: "PaintBrushIcon", href: "/owner/store-design" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// active-state helpers — path ปัจจุบัน → เมนู/กลุ่มที่ตรงกัน
// แนวเดียวกับ resolveMenuKey (menuKeys.ts): longest-prefix + ดู segment boundary
// ─────────────────────────────────────────────────────────────

/** true เมื่อ pathname อยู่ "ภายใต้" href — เท่ากัน หรือเป็น sub-segment (ไม่ใช่แค่ substring ชนกัน) */
export function isPathWithin(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** href ของทุก leaf ในเมนู (ลิงก์ระดับบน + ทุก child) */
export function allMenuHrefs(): string[] {
  const out: string[] = [];
  for (const section of MENU_SECTIONS) {
    for (const item of section.items) {
      if (item.children) out.push(...item.children.map((c) => c.href));
      else if (item.href) out.push(item.href);
    }
  }
  return out;
}

/** leaf ที่ active = href ที่ isPathWithin และยาวที่สุด (→ /owner/ingredients/units ชนะ /owner/ingredients) · null ถ้าไม่มี */
export function findActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const href of allMenuHrefs()) {
    if (isPathWithin(pathname, href) && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

/** key ของกลุ่ม (`${section.labelKey}.${item.labelKey}`) ที่มี child ตรงกับ findActiveHref · null ถ้าหน้าปัจจุบันไม่ได้อยู่ในกลุ่มใด */
export function findActiveGroupKey(pathname: string): string | null {
  const active = findActiveHref(pathname);
  if (active === null) return null;
  for (const section of MENU_SECTIONS) {
    for (const item of section.items) {
      if (item.children?.some((c) => c.href === active)) return `${section.labelKey}.${item.labelKey}`;
    }
  }
  return null;
}
