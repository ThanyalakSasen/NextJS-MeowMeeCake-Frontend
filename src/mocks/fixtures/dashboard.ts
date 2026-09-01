// ─────────────────────────────────────────────────────────────
// src/mocks/fixtures/dashboard.ts  — MOCK (D17)
// snapshot ตัวอย่างของ GET /reports/dashboard — generated_at เติมตอน handler ตอบ
// ─────────────────────────────────────────────────────────────
import type { DashboardSummary } from "@/types/dashboard";

export const dashboardFixture: Omit<DashboardSummary, "generated_at"> = {
  stats: {
    revenue_today: 12450,
    order_count_today: 18,
    pending_order_count: 5,
    low_stock_count: 3,
  },
  recent_orders: [
    { _id: "o_1042", order_no: "ORD-1042", customer_name: "คุณมณีรัตน์", items_summary: "เค้กช็อกโกแลตลาวา × 1, คัพเค้กวานิลลา × 6", total_amount: 759, order_status: "preparing" },
    { _id: "o_1041", order_no: "ORD-1041", customer_name: "คุณธนกร", items_summary: "สตรอว์เบอร์รีชอร์ตเค้ก × 1", total_amount: 520, order_status: "confirmed" },
    { _id: "o_1040", order_no: "ORD-1040", customer_name: "คุณพิมพ์ชนก", items_summary: "โรลเค้กชาเขียว × 2", total_amount: 560, order_status: "ready" },
    { _id: "o_1039", order_no: "ORD-1039", customer_name: "คุณอนุชา", items_summary: "ขนมปังซาวโดว์ × 3", total_amount: 450, order_status: "completed" },
    { _id: "o_1038", order_no: "ORD-1038", customer_name: "คุณศิริพร", items_summary: "คัพเค้กวานิลลา × 12", total_amount: 720, order_status: "pending" },
  ],
  low_stock: [
    { _id: "ing_butter", ingredient_name: "เนยจืด", remaining: 1.5, reorder_point: 5, unit_abbr: "กก." },
    { _id: "ing_cream", ingredient_name: "วิปปิ้งครีม", remaining: 2, reorder_point: 6, unit_abbr: "ล." },
    { _id: "ing_straw", ingredient_name: "สตรอว์เบอร์รีสด", remaining: 0.8, reorder_point: 3, unit_abbr: "กก." },
  ],
  top_products: [
    { _id: "p_vanilla_cup", product_name: "คัพเค้กวานิลลา", sold_qty: 186, revenue: 11160, percent: 100 },
    { _id: "p_choco_lava", product_name: "เค้กช็อกโกแลตลาวา", sold_qty: 92, revenue: 36708, percent: 49 },
    { _id: "p_matcha_roll", product_name: "โรลเค้กชาเขียว", sold_qty: 74, revenue: 20720, percent: 40 },
    { _id: "p_sourdough", product_name: "ขนมปังซาวโดว์", sold_qty: 58, revenue: 8700, percent: 31 },
  ],
  production_status: [
    { _id: "prod_231", production_no: "PRD-231", items_summary: "เค้กช็อกโกแลตลาวา × 20", production_status: "in_progress", due_date: "2026-09-02T00:00:00.000Z" },
    { _id: "prod_232", production_no: "PRD-232", items_summary: "สตรอว์เบอร์รีชอร์ตเค้ก × 15", production_status: "planned", due_date: "2026-09-03T00:00:00.000Z" },
    { _id: "prod_233", production_no: "PRD-233", items_summary: "โรลเค้กชาเขียว × 30", production_status: "planned", due_date: "2026-09-04T00:00:00.000Z" },
  ],
};
