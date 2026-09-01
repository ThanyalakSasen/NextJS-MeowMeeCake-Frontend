// ─────────────────────────────────────────────────────────────
// src/services/reports.ts
// endpoint aggregate /reports/* (docs/API_CONTRACT.md §4) — อ่านอย่างเดียว
// resource อื่น (finance-summary, production-history) เพิ่ม method ที่นี่ตอนทำ screen นั้น
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

const BASE = "/reports";

export const reportsService = {
  dashboard: () => http.get<ItemResponse<DashboardSummary>>(`${BASE}/dashboard`),
};
