// ─────────────────────────────────────────────────────────────
// src/constants/menu.ts
// โครงเมนู Sidebar — label เป็น key ของ i18n namespace "nav" (ไม่ใช่ข้อความตรง ๆ)
// menuKey ไม่ระบุ = แสดงเสมอ (ตราบใด login) · ระบุ = กรองด้วย usePermission(menuKey).view
// ─────────────────────────────────────────────────────────────
import type { MenuKey } from "@/constants/menuKeys";

export interface MenuLeaf {
  labelKey: string; // key ใน messages.*.nav
  href: string;
  menuKey?: MenuKey;
}

export interface MenuNode {
  labelKey: string;
  /** heroicon name — import ที่ Sidebar */
  icon: string;
  href?: string;
  menuKey?: MenuKey;
  children?: MenuLeaf[];
}

export interface MenuSection {
  labelKey: string;
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
          { labelKey: "reportsSales", href: "/owner/reports/sales", menuKey: "reports" },
          { labelKey: "reportsReviews", href: "/owner/reports/reviews", menuKey: "reports" },
        ],
      },
      {
        labelKey: "finance",
        icon: "CurrencyDollarIcon",
        children: [
          { labelKey: "financeExpenses", href: "/owner/finance/expenses", menuKey: "reports" },
          { labelKey: "financeSummary", href: "/owner/finance/summary", menuKey: "reports" },
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
          { labelKey: "promotionsPricing", href: "/owner/promotions/pricing", menuKey: "promotions" },
          { labelKey: "promotionsCoupons", href: "/owner/promotions/coupons", menuKey: "promotions" },
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
          { labelKey: "ingredients", href: "/owner/ingredients", menuKey: "ingredients" },
          { labelKey: "ingredientStock", href: "/owner/ingredients/ingredientStock", menuKey: "stock" },
          { labelKey: "ingredientHistory", href: "/owner/ingredients/ingredientHistory", menuKey: "stock" },
          { labelKey: "units", href: "/owner/ingredients/units", menuKey: "ingredients" },
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
          { labelKey: "employees", href: "/owner/employees", menuKey: "employees" },
          { labelKey: "permissions", href: "/owner/employees/permissions", menuKey: "employees" },
          { labelKey: "userLog", href: "/owner/employees/userLog", menuKey: "employees" },
        ],
      },
      { labelKey: "storeDesign", icon: "PaintBrushIcon", href: "/owner/store-design" },
    ],
  },
];
