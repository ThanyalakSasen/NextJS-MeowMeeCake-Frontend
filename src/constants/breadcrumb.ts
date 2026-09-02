// ─────────────────────────────────────────────────────────────
// src/constants/breadcrumb.ts
// map pathname → key ใน i18n namespace "nav" + สร้าง trail
// ─────────────────────────────────────────────────────────────
import type { BreadcrumbItem } from "@/types";
import type { NavKey } from "@/i18n/keys";

const ROUTE_NAV_KEY: Record<string, NavKey> = {
  "/owner/dashboard": "dashboard",
  "/owner/reports/sales": "reportsSales",
  "/owner/reports/reviews": "reportsReviews",
  "/owner/finance/expenses": "financeExpenses",
  "/owner/finance/summary": "financeSummary",
  "/owner/products": "products",
  "/owner/products/addProducts": "productsAdd",
  "/owner/products/productStock": "productStock",
  "/owner/orders/manageOrders": "ordersManage",
  "/owner/orders/OrderInStore": "ordersInStore",
  "/owner/promotions/pricing": "promotionsPricing",
  "/owner/promotions/coupons": "promotionsCoupons",
  "/owner/production": "production",
  "/owner/ingredients": "ingredients",
  "/owner/ingredients/ingredientStock": "ingredientStock",
  "/owner/ingredients/ingredientHistory": "ingredientHistory",
  "/owner/ingredients/units": "units",
  "/owner/recipes": "recipes",
  "/owner/employees": "employees",
  "/owner/employees/addEmployee": "employeesAdd",
  "/owner/employees/editEmployee": "employeesEdit",
  "/owner/employees/permissions": "permissions",
  "/owner/employees/userLog": "userLog",
  "/owner/attendance": "attendance",
  "/owner/store-design": "storeDesign",
  "/owner/notificationsHistory": "notificationsHistory",
};

/** สร้าง breadcrumb trail จาก pathname — เริ่มด้วย "หน้าหลัก" เสมอ (labelKey = "dashboard") */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ labelKey: "dashboard", href: "/owner/dashboard" }];
  const segments = pathname.split("/").filter(Boolean);
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const key = ROUTE_NAV_KEY[acc];
    if (key && acc !== "/owner/dashboard") crumbs.push({ labelKey: key, href: acc });
  }
  return crumbs;
}
