"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Dashboard — query aggregate เดียว (reportsService.dashboard) + กราฟยอดขายรายวัน
// ไม่มี mutation — แค่โหลด snapshot + refetch · กราฟเลือกช่วง 7 / 30 / 90 วันได้ (salesTrend.ts)
// หน้านี้กั้นด้วย dashboard.view (ROUTE_MENU_MAP) · widget ที่ใช้ API ของเมนูอื่นแสดงเฉพาะเมื่อมีสิทธิ์เมนูนั้น (Final-Backlog P11)
// ยอดแยกช่องทาง (revenue-by-channel) backend ต้องมี finance_summary หรือ finance_expenses (view) — ไม่มี = ไม่แสดงกล่องนั้น
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/reports";
import { usePermission } from "@/context/PermissionsContext";
import {
  CHANNEL_ORDER, DEFAULT_SALES_RANGE, channelRevenueKey, fillDays, rangeStartIso, salesByDayKey, summarize, type SalesRange,
} from "./salesTrend";

export function useDashboardViewModel() {
  const show = {
    orders: usePermission("orders").view,
    ingredients: usePermission("ingredients").view,
  };
  const financeSummary = usePermission("finance_summary").view;
  const financeExpenses = usePermission("finance_expenses").view;
  const canChannels = financeSummary || financeExpenses;

  const q = useQuery({
    queryKey: ["reports", "dashboard", show],
    queryFn: () => reportsService.dashboard(show),
  });

  const d = q.data?.data;

  // ── กราฟยอดขายรายวัน ──
  const [salesRange, setSalesRange] = useState<SalesRange>(DEFAULT_SALES_RANGE);
  const salesQ = useQuery({ queryKey: salesByDayKey(salesRange), queryFn: () => reportsService.salesByDay(salesRange) });
  const channelQ = useQuery({
    queryKey: channelRevenueKey(salesRange),
    queryFn: () => reportsService.revenueByChannel({ date_from: rangeStartIso(salesRange) }),
    enabled: canChannels,
  });
  const salesDays = useMemo(() => (salesQ.data ? fillDays(salesQ.data.series, salesRange) : []), [salesQ.data, salesRange]);
  // กล่องแยกช่องทาง: พรีออเดอร์ (ช่องทางหลักของร้าน) ก่อน · other = เลขออเดอร์รุ่นเก่า แสดงเมื่อมียอด
  const channels = useMemo(() => {
    const r = channelQ.data;
    if (!r) return [];
    return CHANNEL_ORDER.filter((k) => k !== "other" || r.other > 0).map((key) => ({
      key,
      amount: r[key],
      count: r.counts?.[key] ?? 0,
      percent: r.total > 0 ? Math.round((r[key] / r.total) * 100) : 0,
    }));
  }, [channelQ.data]);

  return {
    show,
    stats: d?.stats,
    recentOrders: d?.recent_orders ?? [],
    lowStock: d?.low_stock ?? [],
    topProducts: d?.top_products ?? [],
    generatedAt: d?.generated_at,
    // isPending — render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
    isLoading: q.isPending,
    isError: q.isError,
    refetch: () => q.refetch(),

    sales: {
      range: salesRange,
      setRange: setSalesRange,
      days: salesDays,
      summary: summarize(salesDays),
      isLoading: salesQ.isPending,
      isError: salesQ.isError,
      refetch: () => void salesQ.refetch(),
      /** แท่งซ้อนสีตามช่องทาง — ต้องมีสิทธิ์เดียวกับกล่องแยกช่องทาง และ backend ส่ง channels รายวันมา */
      stacked: canChannels && salesDays.some((day) => day.channels),
      /** null = ไม่มีสิทธิ์ดูยอดแยกช่องทาง (ไม่แสดงกล่อง) */
      channels: canChannels ? channels : null,
      channelsLoading: channelQ.isPending,
      channelsError: channelQ.isError,
      refetchChannels: () => void channelQ.refetch(),
      showFinanceLink: financeSummary,
    },
  };
}
