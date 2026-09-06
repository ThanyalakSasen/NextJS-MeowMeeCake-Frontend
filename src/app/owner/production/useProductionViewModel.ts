"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Production — โหลดใบสั่งผลิตทั้งหมด 1 ครั้ง (mock data เล็ก) แล้วกรอง/แบ่งหน้าฝั่ง client
// เหมือนแพทเทิร์นของ Manage Orders · ใช้ร่วมกันทั้ง 3 แท็บ (แท็บที่กำลังดู sync กับ ?tab= ผ่าน router)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { productionOrdersService } from "@/services/productionOrders";
import { productsService } from "@/services/products";
import { unitsService } from "@/services/units";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { buildMonthOptions } from "@/utils/dateRange";
import type { ProductionStatus, SourceType } from "@/constants/enumConfig";
import type { ProductionOrder, ProductionOrderItem } from "@/types/productionOrder";
import {
  isFinalStatus, getNextStatus, statusChangePatch, durationHours,
} from "./productionStatus";

export type TabKey = "plan" | "status" | "history";
const TAB_KEYS: TabKey[] = ["plan", "status", "history"];

export interface CreateProductionOrderValue {
  production_date: string;
  source_type: SourceType;
  assigned_to: string | null;
  production_note: string | null;
  items: ProductionOrderItem[];
}

export function useProductionViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("production");
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey = TAB_KEYS.includes(tabParam as TabKey) ? (tabParam as TabKey) : "plan";
  const setActiveTab = (key: string) => router.replace(`/owner/production?tab=${key}`, { scroll: false });

  // ── shared data (โหลดครั้งเดียว ใช้ทั้ง 3 แท็บ) ──
  const ordersQ = useQuery({ queryKey: ["production-orders"], queryFn: () => productionOrdersService.list({ limit: 200 }) });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => productsService.list({ limit: 200 }) });
  const unitsQ = useQuery({ queryKey: ["units"], queryFn: () => unitsService.list() });
  const usersQ = useQuery({ queryKey: ["users"], queryFn: () => usersService.list({ limit: 200 }) });
  const rolesQ = useQuery({ queryKey: ["roles"], queryFn: () => rolesService.list() });

  const orders = useMemo(() => ordersQ.data?.data ?? [], [ordersQ.data]);

  /** ตัวเลือกสินค้าในฟอร์ม — join unit_abbr ไว้ล่วงหน้า (View/Modal ไม่ join เอง) */
  const productOptions = useMemo(() => {
    const unitMap = new Map((unitsQ.data?.data ?? []).map((u) => [u._id, u.unit_abbr || u.unit_name]));
    return (productsQ.data?.data ?? []).map((p) => ({
      _id: p._id,
      name: p.product_name_th,
      unit_abbr: (p.unit_id && unitMap.get(p.unit_id)) || "",
    }));
  }, [productsQ.data, unitsQ.data]);

  /** พนักงานที่มอบหมายงานผลิตได้ — active + ไม่ใช่ role ลูกค้า */
  const staff = useMemo(() => {
    const customerRoleIds = new Set(
      (rolesQ.data?.data ?? []).filter((r) => r.role_type === "customer").map((r) => r._id),
    );
    return (usersQ.data?.data ?? []).filter((u) => u.emp_status && u.role_id && !customerRoleIds.has(u.role_id));
  }, [usersQ.data, rolesQ.data]);

  const isLoading = ordersQ.isLoading;
  const isError = ordersQ.isError;
  const refetch = () => ordersQ.refetch();

  // ── แท็บ 1: แผนการผลิต ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductionStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);

  const planFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchSearch = !q || o.production_no.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || o.production_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const planRows = useMemo(
    () => planFiltered.slice((page - 1) * pageSize, page * pageSize),
    [planFiltered, page, pageSize],
  );

  const stats = useMemo(() => ({
    total: orders.length,
    planned: orders.filter((o) => o.production_status === "planned").length,
    in_progress: orders.filter((o) => o.production_status === "in_progress").length,
    done: orders.filter((o) => o.production_status === "done").length,
    cancelled: orders.filter((o) => o.production_status === "cancelled").length,
  }), [orders]);

  // ── รายละเอียดใบสั่งผลิต (ใช้ร่วม: row บนแท็บ 1, การ์ดบนแท็บ 2, row บนแท็บ 3) ──
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const selectedOrder = orders.find((o) => o._id === selectedId) ?? null;

  // ── แท็บ 3: ประวัติการผลิต ──
  const monthOptions = useMemo(() => buildMonthOptions(locale), [locale]);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const doneOrders = useMemo(() => orders.filter((o) => o.production_status === "done"), [orders]);
  const historyRows = useMemo(
    () => doneOrders.filter((o) => (o.completed_at ?? "").startsWith(selectedMonth)),
    [doneOrders, selectedMonth],
  );

  const historyStats = useMemo(() => {
    const totalQty = doneOrders.reduce((s, o) => s + o.items.reduce((si, it) => si + it.planned_qty, 0), 0);
    const durations = doneOrders.map(durationHours).filter((d): d is number => d !== null);
    const avgDuration = durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
    return { totalOrders: doneOrders.length, totalQty, avgDuration };
  }, [doneOrders]);

  const productBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    doneOrders.forEach((o) => o.items.forEach((it) => {
      acc[it.product_name] = (acc[it.product_name] ?? 0) + it.planned_qty;
    }));
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [doneOrders]);

  const teamBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    doneOrders.forEach((o) => { if (o.assignee_name) acc[o.assignee_name] = (acc[o.assignee_name] ?? 0) + 1; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [doneOrders]);

  // ── mutations ──
  const invalidate = () => qc.invalidateQueries({ queryKey: ["production-orders"] });

  const createOrder = useMutation({
    mutationFn: (body: Omit<ProductionOrder, "_id" | "created_at" | "updated_at">) =>
      productionOrdersService.create(body),
    onSuccess: () => {
      alert.success(t("production.created"));
      invalidate();
      setCreateOpen(false);
    },
    onError: () => alert.error(t("production.createFailed")),
  });

  const updateOrder = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ProductionOrder> }) =>
      productionOrdersService.update(id, body),
    onSuccess: invalidate,
  });

  const onCreateSubmit = (v: CreateProductionOrderValue) => {
    const no = `PO-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const assignee = staff.find((s) => s._id === v.assigned_to);
    createOrder.mutate({
      production_no: no,
      production_date: v.production_date,
      source_type: v.source_type,
      production_status: "planned",
      assigned_to: v.assigned_to,
      assignee_name: assignee?.user_fullname ?? null,
      production_note: v.production_note,
      items: v.items,
      started_at: null,
      completed_at: null,
    });
  };

  const onChangeStatus = (order: ProductionOrder, next: ProductionStatus) => {
    if (next === order.production_status) return;
    updateOrder.mutate(
      { id: order._id, body: statusChangePatch(order, next) },
      {
        onSuccess: () => alert.success(
          t("production.statusChanged", { no: order.production_no, status: t(`enums.productionStatus.${next}`) }),
        ),
        onError: () => alert.error(t("production.statusChangeFailed")),
      },
    );
  };

  const onAdvanceStatus = (order: ProductionOrder) => {
    const next = getNextStatus(order.production_status);
    if (next) onChangeStatus(order, next);
  };

  const onCancelOrder = (order: ProductionOrder) => onChangeStatus(order, "cancelled");

  return {
    t, locale, perm,

    activeTab, setActiveTab,

    isLoading, isError, refetch,
    productOptions, staff,

    // แท็บ 1
    search, setSearch: (v: string) => { setSearch(v); setPage(1); },
    statusFilter, setStatusFilter: (v: ProductionStatus | "all") => { setStatusFilter(v); setPage(1); },
    page, pageSize, setPagination: (p: number, ps: number) => { setPage(p); setPageSize(ps); },
    planRows, planTotal: planFiltered.length, stats,
    createOpen, openCreate: () => setCreateOpen(true), closeCreate: () => setCreateOpen(false),
    onCreateSubmit, creating: createOrder.isPending,

    // แท็บ 2
    orders,

    // แท็บ 3
    monthOptions, selectedMonth, setSelectedMonth,
    historyRows, historyStats, productBreakdown, teamBreakdown,

    // รายละเอียด (ใช้ร่วม)
    selectedOrder, drawerOpen,
    onView: (o: ProductionOrder) => { setSelectedId(o._id); setDrawerOpen(true); },
    closeDrawer: () => setDrawerOpen(false),

    isFinalStatus, getNextStatus,
    onChangeStatus, onAdvanceStatus, onCancelOrder,
  };
}
