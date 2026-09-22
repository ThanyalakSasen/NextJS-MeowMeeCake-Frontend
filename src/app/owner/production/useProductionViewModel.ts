"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Production — โหลดใบสั่งผลิตทั้งหมด 1 ครั้ง (mock data เล็ก) แล้วกรอง/แบ่งหน้าฝั่ง client
// เหมือนแพทเทิร์นของ Manage Orders · ใช้ร่วมกันทั้ง 3 แท็บ (แท็บที่กำลังดู sync กับ ?tab= ผ่าน router)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { productionOrdersService } from "@/services/productionOrders";
import { productsService } from "@/services/products";
import { unitsService } from "@/services/units";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { recipesService } from "@/services/recipes";
import { preorderRoundsService } from "@/services/preorderRounds";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { refId } from "@/lib/refId";
import type { ProductionStatus } from "@/constants/enumConfig";
import type {
  ProductionOrder, RawProductionOrder, CreateProductionOrderItemInput, ProductionOrderFromRoundInput,
} from "@/types/productionOrder";
import {
  isFinalStatus, getNextStatus, durationHours,
} from "./productionStatus";

export type TabKey = "plan" | "status" | "history";
const TAB_KEYS: TabKey[] = ["plan", "status", "history"];

/** โหมดดูประวัติการผลิต — ตรงกับ unit ที่ dayjs().isSame() รับ (day/month/year) */
export type HistoryViewMode = "day" | "month" | "year";

export interface CreateProductionOrderValue {
  production_date: string;
  assigned_to: string | null;
  production_note: string | null;
  items: CreateProductionOrderItemInput[];
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
  const recipesQ = useQuery({ queryKey: ["recipes"], queryFn: () => recipesService.list({ limit: 100 }) });
  // รอบพรีออเดอร์ที่ "ปิดรับแล้ว" — ตัวเลือกตอนสร้างใบสั่งผลิตจากรอบ (เฉพาะที่ยังไม่มีใบสั่งผลิตอยู่)
  const closedRoundsQ = useQuery({
    queryKey: ["preorder-rounds", "closed"],
    queryFn: () => preorderRoundsService.list({ status: "closed", limit: 100 }),
  });

  /** ชื่อ/หน่วยของทุกสินค้า (ไม่กรอง) — ใช้ enrich รายการของใบสั่งผลิตเก่าด้วย แม้สินค้านั้นจะไม่มีสูตรแล้วก็ตาม */
  const productsById = useMemo(() => {
    const unitMap = new Map((unitsQ.data?.data ?? []).map((u) => [u._id, u.unit_abbr || u.unit_name]));
    const map = new Map<string, { name: string; unit_abbr: string }>();
    (productsQ.data?.data ?? []).forEach((p) => {
      map.set(p._id, { name: p.product_name_th, unit_abbr: (refId(p.unit_id) && unitMap.get(refId(p.unit_id))) || "" });
    });
    return map;
  }, [productsQ.data, unitsQ.data]);

  /** product_id → recipe_id ตัวแรกที่พบ (backend บังคับทุก production item ต้องผูก recipe_id จริง) */
  const recipeByProduct = useMemo(() => {
    const map = new Map<string, string>();
    (recipesQ.data?.data ?? []).forEach((r) => {
      if (r.product_id && !map.has(r.product_id)) map.set(r.product_id, r._id);
    });
    return map;
  }, [recipesQ.data]);

  const orders: ProductionOrder[] = useMemo(() => {
    const raw = (ordersQ.data?.data ?? []) as RawProductionOrder[];
    return raw.map((o) => ({
      _id: o._id,
      production_no: o.production_no,
      production_date: o.production_date,
      source_type: o.source_type,
      round_id: refId(o.round_id) || null,
      round_name: typeof o.round_id === "object" && o.round_id ? o.round_id.round_name : null,
      production_status: o.production_status,
      assigned_to: refId(o.assigned_to) || null,
      assignee_name: typeof o.assigned_to === "object" && o.assigned_to ? o.assigned_to.user_fullname : null,
      production_note: o.production_note ?? null,
      started_at: o.started_at ?? null,
      completed_at: o.completed_at ?? null,
      created_at: o.created_at,
      updated_at: o.updated_at,
      items: (o.items ?? []).map((it) => {
        const pid = refId(it.product_id);
        const info = productsById.get(pid);
        return {
          _id: it._id,
          product_id: pid,
          recipe_id: refId(it.recipe_id),
          product_name: info?.name ?? (typeof it.product_id === "object" && it.product_id ? it.product_id.product_name_th : ""),
          unit_abbr: info?.unit_abbr ?? "",
          planned_qty: it.planned_qty,
          actual_qty: it.actual_qty ?? null,
          item_status: it.item_status,
          notes: it.notes ?? null,
        };
      }),
    }));
  }, [ordersQ.data, productsById]);

  /** ตัวเลือกสินค้าตอนสร้างใบสั่งผลิต — เฉพาะสินค้าที่มีสูตรผูกแล้วเท่านั้น (ไม่งั้น backend reject ทันที) */
  const productOptions = useMemo(() => (
    (productsQ.data?.data ?? [])
      .filter((p) => recipeByProduct.has(p._id))
      .map((p) => ({
        _id: p._id,
        name: productsById.get(p._id)?.name ?? p.product_name_th,
        unit_abbr: productsById.get(p._id)?.unit_abbr ?? "",
        recipe_id: recipeByProduct.get(p._id)!,
      }))
  ), [productsQ.data, recipeByProduct, productsById]);

  /** พนักงานที่มอบหมายงานผลิตได้ — active + ไม่ใช่ role ลูกค้า */
  const staff = useMemo(() => {
    const customerRoleIds = new Set(
      (rolesQ.data?.data ?? []).filter((r) => r.role_type === "customer").map((r) => r._id),
    );
    return (usersQ.data?.data ?? []).filter((u) => u.emp_status && u.role_id && !customerRoleIds.has(u.role_id));
  }, [usersQ.data, rolesQ.data]);

  /** รอบที่ปิดรับแล้ว "และ" ยังไม่มีใบสั่งผลิต (source_type preorder, ไม่ใช่ cancelled) ผูกอยู่ —
   *  backend อนุญาตแค่ 1 ใบต่อรอบ (409 ถ้าซ้ำ) กรองไว้ที่นี่กันเลือกแล้วเจอ error ทันที */
  const roundsWithProduction = useMemo(
    () => new Set(
      orders.filter((o) => o.source_type === "preorder" && o.production_status !== "cancelled" && o.round_id)
        .map((o) => o.round_id as string),
    ),
    [orders],
  );
  const eligibleRounds = useMemo(
    () => (closedRoundsQ.data?.data ?? []).filter((r) => !roundsWithProduction.has(r._id)),
    [closedRoundsQ.data, roundsWithProduction],
  );

  const isLoading = ordersQ.isLoading;
  const isError = ordersQ.isError;
  const refetch = () => ordersQ.refetch();

  // ── แท็บ 1: แผนการผลิต ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductionStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createFromRoundOpen, setCreateFromRoundOpen] = useState(false);

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

  // ── แท็บ 3: ประวัติการผลิต — เลือกดูแบบรายวัน/รายเดือน/รายปี ──
  const [historyViewMode, setHistoryViewMode] = useState<HistoryViewMode>("month");
  const [historyDate, setHistoryDate] = useState<Dayjs>(() => dayjs());

  const doneOrders = useMemo(() => orders.filter((o) => o.production_status === "done"), [orders]);
  const historyRows = useMemo(
    () =>
      doneOrders.filter((o) => {
        if (!o.completed_at) return false;
        return dayjs(o.completed_at).isSame(historyDate, historyViewMode);
      }),
    [doneOrders, historyViewMode, historyDate],
  );

  // สถิติ/breakdown อิงตามช่วงที่เลือก (historyRows) ไม่ใช่ all-time — ให้ตรงกับตัวกรองวัน/เดือน/ปี
  const historyStats = useMemo(() => {
    const totalQty = historyRows.reduce((s, o) => s + o.items.reduce((si, it) => si + it.planned_qty, 0), 0);
    const durations = historyRows.map(durationHours).filter((d): d is number => d !== null);
    const avgDuration = durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
    return { totalOrders: historyRows.length, totalQty, avgDuration };
  }, [historyRows]);

  const productBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    historyRows.forEach((o) => o.items.forEach((it) => {
      acc[it.product_name] = (acc[it.product_name] ?? 0) + it.planned_qty;
    }));
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [historyRows]);

  const teamBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    historyRows.forEach((o) => { if (o.assignee_name) acc[o.assignee_name] = (acc[o.assignee_name] ?? 0) + 1; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [historyRows]);

  // ── mutations ──
  const invalidate = () => qc.invalidateQueries({ queryKey: ["production-orders"] });

  const createOrder = useMutation({
    mutationFn: (v: CreateProductionOrderValue) =>
      productionOrdersService.create({
        production_date: v.production_date,
        assigned_to: v.assigned_to,
        production_note: v.production_note,
        items: v.items,
      }),
    onSuccess: () => {
      alert.success(t("production.created"));
      invalidate();
      setCreateOpen(false);
    },
    onError: () => alert.error(t("production.createFailed")),
  });

  const createFromRound = useMutation({
    mutationFn: (v: ProductionOrderFromRoundInput) => productionOrdersService.createFromRound(v),
    onSuccess: () => {
      alert.success(t("production.fromRoundCreated"));
      invalidate();
      qc.invalidateQueries({ queryKey: ["preorder-rounds"] });
      setCreateFromRoundOpen(false);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("production.fromRoundCreateFailed")),
  });

  /** เปลี่ยนสถานะผ่าน sub-route เฉพาะทาง (start/complete/cancel) — PATCH ตรง ๆ ไม่มีผล (backend เพิกเฉย production_status) */
  const changeStatus = useMutation({
    mutationFn: ({ order, next }: { order: ProductionOrder; next: ProductionStatus }) => {
      if (next === "in_progress") return productionOrdersService.start(order._id);
      if (next === "done") return productionOrdersService.complete(order._id);
      return productionOrdersService.cancel(order._id);
    },
    onSuccess: invalidate,
  });

  const onCreateSubmit = (v: CreateProductionOrderValue) => createOrder.mutate(v);

  const onChangeStatus = (order: ProductionOrder, next: ProductionStatus) => {
    if (next === order.production_status) return;
    changeStatus.mutate(
      { order, next },
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

    eligibleRounds,
    createFromRoundOpen, openCreateFromRound: () => setCreateFromRoundOpen(true), closeCreateFromRound: () => setCreateFromRoundOpen(false),
    onCreateFromRoundSubmit: (v: ProductionOrderFromRoundInput) => createFromRound.mutate(v),
    creatingFromRound: createFromRound.isPending,

    // แท็บ 2
    orders,

    // แท็บ 3
    historyViewMode, setHistoryViewMode,
    historyDate, setHistoryDate,
    historyRows, historyStats, productBreakdown, teamBreakdown,

    // รายละเอียด (ใช้ร่วม)
    selectedOrder, drawerOpen,
    onView: (o: ProductionOrder) => { setSelectedId(o._id); setDrawerOpen(true); },
    closeDrawer: () => setDrawerOpen(false),

    isFinalStatus, getNextStatus,
    onChangeStatus, onAdvanceStatus, onCancelOrder,
  };
}
