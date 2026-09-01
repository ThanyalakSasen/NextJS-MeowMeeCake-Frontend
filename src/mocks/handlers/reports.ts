// ─────────────────────────────────────────────────────────────
// src/mocks/handlers/reports.ts
// endpoint aggregate /reports/* — ไม่ใช่ CRUD จึงไม่ใช้ crudHandlers
// ─────────────────────────────────────────────────────────────
import { http, HttpResponse } from "msw";
import { dashboardFixture } from "@/mocks/fixtures/dashboard";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const reportsHandlers = [
  http.get(`${API}/reports/dashboard`, () =>
    HttpResponse.json({ data: { ...dashboardFixture, generated_at: new Date().toISOString() } }),
  ),
];
