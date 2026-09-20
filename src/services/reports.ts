// ─────────────────────────────────────────────────────────────
// src/services/reports.ts
// ไม่มี endpoint /reports/dashboard เดียวจบ — backend แยกเป็นหลาย endpoint (dashboard/*, ingredients/
// low-stock, orders, production-orders) ประกอบ DashboardSummary ที่นี่จุดเดียว (ViewModel ไม่ต้องรู้)
//
// ที่ไม่ได้ทำให้ครบ 100% (แลกความง่าย — ไม่เพิ่ม N+1 request ต่อรายการ):
//   - recent_orders[].items_summary และ production_status[].items_summary ปล่อยว่าง เพราะ items
//     ของ order/production แยก collection กัน ต้องยิงเพิ่มทีละรายการถึงจะได้ (ยังไม่คุ้มสำหรับ dashboard)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type {
  DashboardSummary,
  DashboardLowStock,
  DashboardRecentOrder,
  DashboardTopProduct,
  DashboardProduction,
} from "@/types/dashboard";

// ── shape ดิบเฉพาะจุดที่ dashboard ใช้ (ไม่ผ่าน Order/ProductionOrder DTO ที่ยังไม่ตรง backend) ──
interface RawOverview {
  orders: { total: number; by_status: Record<string, number>; paid: number };
  revenue: number;
  low_stock: { products: number; ingredients: number };
}
interface RawLowStockIngredient {
  _id: string;
  ingredient_name: string;
  current_stock: number;
  reorder_point: number;
  unit_id?: { unit_abbr?: string; unit_name?: string } | string | null;
}
interface RawTopProductsResult {
  items: { product_id: string; product_name_th: string; quantity_sold: number; revenue: number }[];
}
interface RawOrder {
  _id: string;
  order_no: string;
  total_amount: number;
  order_status: string;
  user_id?: { user_fullname?: string } | string | null;
}
interface RawProductionOrder {
  _id: string;
  production_no: string;
  production_status: string;
  production_date: string;
}

/** ช่วงเวลา "วันนี้" ตามเวลาไทย (UTC+7 คงที่ ไม่มี DST) แปลงเป็นขอบเขต UTC ให้ query created_at ได้ */
function bangkokTodayRangeUtc(): { date_from: string; date_to: string } {
  const OFFSET_MS = 7 * 60 * 60 * 1000;
  const bkkNow = new Date(Date.now() + OFFSET_MS);
  const y = bkkNow.getUTCFullYear();
  const m = bkkNow.getUTCMonth();
  const d = bkkNow.getUTCDate();
  const startUtcMs = Date.UTC(y, m, d, 0, 0, 0, 0) - OFFSET_MS;
  const endUtcMs = Date.UTC(y, m, d, 23, 59, 59, 999) - OFFSET_MS;
  return { date_from: new Date(startUtcMs).toISOString(), date_to: new Date(endUtcMs).toISOString() };
}

function unitAbbrOf(unit: RawLowStockIngredient["unit_id"]): string {
  if (!unit || typeof unit === "string") return "";
  return unit.unit_abbr || unit.unit_name || "";
}

function customerNameOf(user: RawOrder["user_id"]): string {
  if (!user || typeof user === "string") return "-";
  return user.user_fullname || "-";
}

export interface TopProductRow {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

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

  /** GET /admin/dashboard/top-products — จัดอันดับตาม quantity_sold เสมอ (backend เรียงให้แบบนี้
   *  เท่านั้น ไม่มีพารามิเตอร์ sort อื่น) จำกัดสูงสุด 50 รายการ (backend clamp) */
  topProducts: async (params: { limit?: number; date_from?: string; date_to?: string } = {}): Promise<TopProductRow[]> => {
    const res = await http.get<{ data: RawTopProductsResult }>("/admin/dashboard/top-products", { params });
    return res.data.items.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name_th,
      quantity_sold: p.quantity_sold,
      revenue: p.revenue,
    }));
  },

  dashboard: async (): Promise<{ data: DashboardSummary }> => {
    const today = bangkokTodayRangeUtc();

    const [overviewToday, overviewAllTime, lowStockRes, topProductsRes, recentOrdersRes, productionRes] =
      await Promise.all([
        http.get<{ data: RawOverview }>("/admin/dashboard/overview", { params: today }),
        http.get<{ data: RawOverview }>("/admin/dashboard/overview"),
        http.get<{ data: { count: number; items: RawLowStockIngredient[] } }>(
          "/admin/ingredients/low-stock",
          { params: { limit: 10 } }
        ),
        http.get<{ data: RawTopProductsResult }>("/admin/dashboard/top-products", {
          params: { limit: 5 },
        }),
        http.getList<RawOrder>("/admin/orders", { params: { limit: 5 } }),
        http.getList<RawProductionOrder>("/admin/production-orders", { params: { limit: 20 } }),
      ]);

    const lowStock: DashboardLowStock[] = lowStockRes.data.items.map((i) => ({
      _id: i._id,
      ingredient_name: i.ingredient_name,
      remaining: i.current_stock,
      reorder_point: i.reorder_point,
      unit_abbr: unitAbbrOf(i.unit_id),
    }));

    const topRows = topProductsRes.data.items;
    const maxQty = topRows[0]?.quantity_sold || 1;
    const topProducts: DashboardTopProduct[] = topRows.map((p) => ({
      _id: p.product_id,
      product_name: p.product_name_th,
      sold_qty: p.quantity_sold,
      revenue: p.revenue,
      percent: Math.round((p.quantity_sold / maxQty) * 100),
    }));

    const recentOrders: DashboardRecentOrder[] = recentOrdersRes.data.map((o) => ({
      _id: o._id,
      order_no: o.order_no,
      customer_name: customerNameOf(o.user_id),
      items_summary: "",
      total_amount: o.total_amount,
      order_status: o.order_status as DashboardRecentOrder["order_status"],
    }));

    const productionStatus: DashboardProduction[] = productionRes.data
      .filter((p) => p.production_status === "planned" || p.production_status === "in_progress")
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        production_no: p.production_no,
        items_summary: "",
        production_status: p.production_status as DashboardProduction["production_status"],
        due_date: p.production_date,
      }));

    return {
      data: {
        stats: {
          revenue_today: overviewToday.data.revenue,
          order_count_today: overviewToday.data.orders.total,
          pending_order_count: overviewAllTime.data.orders.by_status.pending ?? 0,
          low_stock_count:
            overviewAllTime.data.low_stock.products + overviewAllTime.data.low_stock.ingredients,
        },
        recent_orders: recentOrders,
        low_stock: lowStock,
        top_products: topProducts,
        production_status: productionStatus,
        generated_at: new Date().toISOString(),
      },
    };
  },
};
