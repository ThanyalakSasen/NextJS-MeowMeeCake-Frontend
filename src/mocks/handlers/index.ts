// ─────────────────────────────────────────────────────────────
// src/mocks/handlers/index.ts  — รวม handler ทุก resource + seed fixtures
// เฟส 4: เพิ่ม resource ใหม่ = seed(...) + crudHandlers(...) อีก 1 บรรทัด
// ─────────────────────────────────────────────────────────────
import { seed } from "@/mocks/db";
import { authHandlers } from "@/mocks/handlers/auth";
import { crudHandlers } from "@/mocks/handlers/_crud";
import { productsFixture } from "@/mocks/fixtures/products";
import { notificationsFixture } from "@/mocks/fixtures/notifications";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// ── seed ──
seed("products", productsFixture);
seed("notifications", notificationsFixture);

// ── handlers ──
export const handlers = [
  ...authHandlers,
  ...crudHandlers("products", `${API}/products`),
  ...crudHandlers("notifications", `${API}/notifications`),
];
