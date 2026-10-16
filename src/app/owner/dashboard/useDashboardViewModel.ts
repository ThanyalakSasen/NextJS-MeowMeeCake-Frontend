"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Dashboard — query aggregate เดียว (reportsService.dashboard)
// ไม่มี mutation / filter — แค่โหลด snapshot + refetch
// หน้านี้กั้นด้วย dashboard.view (ROUTE_MENU_MAP) · widget ที่ใช้ API ของเมนูอื่นแสดงเฉพาะเมื่อมีสิทธิ์เมนูนั้น (Final-Backlog P11)
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/reports";
import { usePermission } from "@/context/PermissionsContext";

export function useDashboardViewModel() {
  const show = {
    orders: usePermission("orders").view,
    ingredients: usePermission("ingredients").view,
    production: usePermission("production").view,
  };

  const q = useQuery({
    queryKey: ["reports", "dashboard", show],
    queryFn: () => reportsService.dashboard(show),
  });

  const d = q.data?.data;

  return {
    show,
    stats: d?.stats,
    recentOrders: d?.recent_orders ?? [],
    lowStock: d?.low_stock ?? [],
    topProducts: d?.top_products ?? [],
    productionStatus: d?.production_status ?? [],
    generatedAt: d?.generated_at,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),
  };
}
