// ─────────────────────────────────────────────────────────────
// src/mocks/handlers/index.ts  — รวม handler ทุก resource + seed fixtures
// เฟส 4: เพิ่ม resource ใหม่ = seed(...) + crudHandlers(...) อีก 1 บรรทัด
// ─────────────────────────────────────────────────────────────
import { seed } from "@/mocks/db";
import { authHandlers } from "@/mocks/handlers/auth";
import { crudHandlers } from "@/mocks/handlers/_crud";
import { reportsHandlers } from "@/mocks/handlers/reports";
import { productsFixture } from "@/mocks/fixtures/products";
import { productCategoriesFixture } from "@/mocks/fixtures/productCategories";
import { unitsFixture } from "@/mocks/fixtures/units";
import { notificationsFixture } from "@/mocks/fixtures/notifications";
import { ordersFixture } from "@/mocks/fixtures/orders";
import { ingredientsFixture } from "@/mocks/fixtures/ingredients";
import { ingredientCategoriesFixture } from "@/mocks/fixtures/ingredientCategories";
import { ingredientTransactionsFixture } from "@/mocks/fixtures/ingredientTransactions";
import { usersFixture } from "@/mocks/fixtures/users";
import { rolesFixture } from "@/mocks/fixtures/roles";
import { permissionsFixture } from "@/mocks/fixtures/permissions";
import { userLogsFixture } from "@/mocks/fixtures/userLogs";
import { bannersFixture } from "@/mocks/fixtures/banners";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// ── seed ──
seed("products", productsFixture);
seed("product-categories", productCategoriesFixture);
seed("units", unitsFixture);
seed("notifications", notificationsFixture);
seed("orders", ordersFixture);
seed("ingredients", ingredientsFixture);
seed("ingredient-categories", ingredientCategoriesFixture);
seed("ingredient-transactions", ingredientTransactionsFixture);
seed("users", usersFixture);
seed("roles", rolesFixture);
seed("permissions", permissionsFixture);
seed("user-logs", userLogsFixture);
seed("banners", bannersFixture);

// ── handlers ──
export const handlers = [
  ...authHandlers,
  ...reportsHandlers,
  ...crudHandlers("products", `${API}/products`),
  ...crudHandlers("product-categories", `${API}/product-categories`),
  ...crudHandlers("units", `${API}/units`),
  ...crudHandlers("notifications", `${API}/notifications`),
  ...crudHandlers("orders", `${API}/orders`),
  ...crudHandlers("ingredients", `${API}/ingredients`),
  ...crudHandlers("ingredient-categories", `${API}/ingredient-categories`),
  ...crudHandlers("ingredient-transactions", `${API}/ingredient-transactions`),
  ...crudHandlers("users", `${API}/users`),
  ...crudHandlers("roles", `${API}/roles`),
  ...crudHandlers("permissions", `${API}/permissions`),
  ...crudHandlers("user-logs", `${API}/user-logs`),
  ...crudHandlers("banners", `${API}/banners`),
];
