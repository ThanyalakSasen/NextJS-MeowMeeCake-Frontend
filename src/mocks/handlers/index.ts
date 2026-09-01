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

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// ── seed ──
seed("products", productsFixture);
seed("product-categories", productCategoriesFixture);
seed("units", unitsFixture);
seed("notifications", notificationsFixture);

// ── handlers ──
export const handlers = [
  ...authHandlers,
  ...reportsHandlers,
  ...crudHandlers("products", `${API}/products`),
  ...crudHandlers("product-categories", `${API}/product-categories`),
  ...crudHandlers("units", `${API}/units`),
  ...crudHandlers("notifications", `${API}/notifications`),
];
