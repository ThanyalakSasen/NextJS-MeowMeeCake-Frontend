"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Dashboard — query aggregate เดียว (GET /reports/dashboard)
// ไม่มี mutation / filter — แค่โหลด snapshot + refetch
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/reports";

export function useDashboardViewModel() {
  const q = useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: () => reportsService.dashboard(),
  });

  const d = q.data?.data;

  return {
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
