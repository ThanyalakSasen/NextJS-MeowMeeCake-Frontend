// ─────────────────────────────────────────────────────────────
// src/services/reports.ts
// endpoint aggregate /reports/* (docs/API_CONTRACT.md §4) — อ่านอย่างเดียว
// resource อื่น (finance-summary, production-history) เพิ่ม method ที่นี่ตอนทำ screen นั้น
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

const BASE = "/reports";

/** GET /admin/dashboard/revenue-by-type — รายรับ (ออเดอร์ที่ชำระแล้ว) แยกตาม product_type เป็นบาท
 *  ผลรวมทุกช่องตรง total ของออเดอร์เสมอ (ค่าส่ง/ส่วนลดกระจายตามสัดส่วนที่ backend) */
export interface RevenueByType {
  in_store: number;
  online: number;
  preorder: number;
  /** สินค้าที่หาไม่เจอ/ออเดอร์ไม่มีรายการ */
  unclassified: number;
  total: number;
  orders: number;
}

export const reportsService = {
  revenueByType: async (params: { date_from?: string; date_to?: string } = {}): Promise<RevenueByType> => {
    const res = await http.get<{ data: RevenueByType }>("/admin/dashboard/revenue-by-type", { params });
    return res.data;
  },

  dashboard: () => http.get<ItemResponse<DashboardSummary>>(`${BASE}/dashboard`),
};
