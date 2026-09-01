// ─────────────────────────────────────────────────────────────
// src/types/dashboard.ts
// DTO ของ GET /reports/dashboard (docs/API_CONTRACT.md §4)
// aggregate อ่านอย่างเดียว — backend คำนวณให้ frontend ไม่ประกอบเอง
// ─────────────────────────────────────────────────────────────
import type { OrderStatus, ProductionStatus } from "@/constants/enumConfig";

/** ตัวเลขสรุปหัวหน้า (stat cards) */
export interface DashboardStats {
  /** ยอดขายวันนี้ เฉพาะออเดอร์ที่ชำระแล้ว */
  revenue_today: number;
  /** จำนวนออเดอร์วันนี้ (รวมพรีออเดอร์) */
  order_count_today: number;
  /** ออเดอร์ที่ยังรอดำเนินการ */
  pending_order_count: number;
  /** จำนวนวัตถุดิบที่ต่ำกว่าจุดสั่งซื้อ */
  low_stock_count: number;
}

export interface DashboardRecentOrder {
  _id: string;
  order_no: string;
  customer_name: string;
  /** สรุปรายการสั้น ๆ เช่น "คัพเค้ก × 6, เค้กลาวา × 1" */
  items_summary: string;
  total_amount: number;
  order_status: OrderStatus;
}

export interface DashboardLowStock {
  _id: string;
  ingredient_name: string;
  remaining: number;
  reorder_point: number;
  /** ตัวย่อหน่วยนับ เช่น "กก." */
  unit_abbr: string;
}

export interface DashboardTopProduct {
  _id: string;
  product_name: string;
  sold_qty: number;
  revenue: number;
  /** 0–100 เทียบกับสินค้าที่ขายดีที่สุดในช่วงนี้ (backend คำนวณ) */
  percent: number;
}

export interface DashboardProduction {
  _id: string;
  production_no: string;
  items_summary: string;
  production_status: ProductionStatus;
  /** ISO — วันกำหนดผลิต */
  due_date: string;
}

export interface DashboardSummary {
  stats: DashboardStats;
  recent_orders: DashboardRecentOrder[];
  low_stock: DashboardLowStock[];
  top_products: DashboardTopProduct[];
  production_status: DashboardProduction[];
  /** ISO — เวลาที่ backend คำนวณ snapshot นี้ */
  generated_at: string;
}
