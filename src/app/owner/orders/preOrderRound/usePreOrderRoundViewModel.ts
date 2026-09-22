"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Pre-order Round — 2 แท็บ (รอบพรีออเดอร์ / คำสั่งซื้อเค้กวันเกิด) sync กับ ?tab=
// ผ่าน router (แพทเทิร์นเดียวกับ Production) · โหลดรอบ+พรีออเดอร์ทั้งหมด 1 ครั้งต่อแท็บ แล้วกรอง/
// แบ่งหน้าฝั่ง client เหมือน Manage Orders/Production
//
// permission gate ใช้ "preorder" ตรงกับที่ backend เช็คจริงใน withPermission ของ /admin/preorder-rounds
// และ /admin/preorders (constants/menuKeys.ts มี "preorder" ครบ และหน้าจัดการสิทธิ์ให้สิทธิ์นี้ได้แล้ว)
// path หน้านี้ map เป็น "preorder" ใน ROUTE_MENU_MAP ส่วน "/owner/orders" ที่เหลือยังเป็น "orders"
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { preorderRoundsService } from "@/services/preorderRounds";
import { preordersService } from "@/services/preorders";
import { productsService } from "@/services/products";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { OrderStatus, RoundStatus } from "@/constants/enumConfig";
import type { PreorderRound, CreateRoundInput, RoundItemInput, UpdateRoundInput, UpdateRoundItemInput } from "@/types/preorderRound";
import type { Preorder } from "@/types/preorder";
import { getNextRoundStatus, isFinalRoundStatus, getNextOrderStatus, isFinalOrderStatus } from "./preorderStatus";

export type TabKey = "rounds" | "orders";
const TAB_KEYS: TabKey[] = ["rounds", "orders"];

export function usePreOrderRoundViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("preorder"); // backend เช็ค menu_key "preorder" กับ /admin/preorder-rounds + /admin/preorders
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey = TAB_KEYS.includes(tabParam as TabKey) ? (tabParam as TabKey) : "rounds";
  const setActiveTab = (key: string) => router.replace(`/owner/orders/preOrderRound?tab=${key}`, { scroll: false });

  // ── สินค้าพรีออเดอร์ (ใช้เป็นตัวเลือกตอนเพิ่มสินค้าเข้ารอบ) ──
  const productsQ = useQuery({
    queryKey: ["products", "preorder-type"],
    queryFn: () => productsService.list({ limit: 200, product_type: "preorder" }),
  });
  const preorderProducts = productsQ.data?.data ?? [];

  // ══════════════════ แท็บ 1: รอบพรีออเดอร์ ══════════════════
  const roundsQ = useQuery({ queryKey: ["preorder-rounds"], queryFn: () => preorderRoundsService.list({ limit: 100 }) });
  const rounds = useMemo(() => roundsQ.data?.data ?? [], [roundsQ.data]);

  const [roundSearch, setRoundSearchState] = useState("");
  const [roundStatusFilter, setRoundStatusFilterState] = useState<RoundStatus | "all">("all");
  const [roundPage, setRoundPage] = useState(1);
  const [roundPageSize, setRoundPageSize] = useState(10);

  const roundsFiltered = useMemo(() => {
    const q = roundSearch.trim().toLowerCase();
    return rounds.filter((r) => {
      const matchSearch = !q || r.round_name.toLowerCase().includes(q);
      const matchStatus = roundStatusFilter === "all" || r.round_status === roundStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [rounds, roundSearch, roundStatusFilter]);

  const roundRows = useMemo(
    () => roundsFiltered.slice((roundPage - 1) * roundPageSize, roundPage * roundPageSize),
    [roundsFiltered, roundPage, roundPageSize],
  );

  const roundStats = useMemo(() => ({
    total: rounds.length,
    scheduled: rounds.filter((r) => r.round_status === "scheduled").length,
    open: rounds.filter((r) => r.round_status === "open").length,
    closed: rounds.filter((r) => r.round_status === "closed" || r.round_status === "cancelled").length,
  }), [rounds]);

  const invalidateRounds = (roundId?: string | null) => {
    qc.invalidateQueries({ queryKey: ["preorder-rounds"] });
    if (roundId) qc.invalidateQueries({ queryKey: ["preorder-rounds", "detail", roundId] });
  };

  // สร้างรอบใหม่ (ใส่รายการสินค้าเริ่มต้นไปพร้อมกันได้)
  const [createRoundOpen, setCreateRoundOpen] = useState(false);
  const createRound = useMutation({
    mutationFn: (v: CreateRoundInput) => preorderRoundsService.create(v),
    onSuccess: () => {
      alert.success(t("preorderRound.created"));
      invalidateRounds();
      setCreateRoundOpen(false);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.createFailed")),
  });

  // รายละเอียดรอบ (ใช้ทั้งดู + จัดการสินค้าในรอบ) — ดึงเฉพาะตอนเปิด drawer
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [roundDrawerOpen, setRoundDrawerOpen] = useState(false);
  const roundDetailQ = useQuery({
    queryKey: ["preorder-rounds", "detail", selectedRoundId],
    queryFn: () => preorderRoundsService.get(selectedRoundId as string),
    enabled: !!selectedRoundId && roundDrawerOpen,
  });
  const selectedRound = roundDetailQ.data?.data ?? null;

  const onViewRound = (r: PreorderRound) => { setSelectedRoundId(r._id); setRoundDrawerOpen(true); };
  const closeRoundDrawer = () => setRoundDrawerOpen(false);

  // แก้ชื่อ/ช่วงเวลาของรอบ (เฉพาะ scheduled/open — closed/cancelled แก้ไม่ได้ backend ปฏิเสธ 409)
  const [editRoundOpen, setEditRoundOpen] = useState(false);
  const updateRound = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRoundInput }) => preorderRoundsService.update(id, body),
    onSuccess: () => {
      alert.success(t("preorderRound.updated"));
      invalidateRounds(selectedRoundId);
      setEditRoundOpen(false);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.updateFailed")),
  });

  // เปลี่ยนสถานะรอบ (เดินหน้าทีละสถานะ) + ยกเลิก
  const changeRoundStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoundStatus }) => preorderRoundsService.updateStatus(id, status),
    onSuccess: () => invalidateRounds(selectedRoundId),
  });

  const onAdvanceRoundStatus = (round: PreorderRound) => {
    const next = getNextRoundStatus(round.round_status);
    if (!next) return;
    changeRoundStatus.mutate(
      { id: round._id, status: next },
      {
        onSuccess: () => alert.success(t("preorderRound.statusChanged", { name: round.round_name, status: t(`enums.roundStatus.${next}`) })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.statusChangeFailed")),
      },
    );
  };

  const onCancelRound = (round: PreorderRound) => {
    changeRoundStatus.mutate(
      { id: round._id, status: "cancelled" },
      {
        onSuccess: () => alert.success(t("preorderRound.cancelled", { name: round.round_name })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.cancelFailed")),
      },
    );
  };

  // ลบรอบ (soft) — backend ปฏิเสธถ้ายังมีพรีออเดอร์ค้างอยู่
  const deleteRound = useMutation({
    mutationFn: (id: string) => preorderRoundsService.remove(id),
    onSuccess: () => { alert.success(t("preorderRound.deleted")); invalidateRounds(); },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.deleteFailed")),
  });

  // ── จัดการสินค้าในรอบ (เพิ่ม/แก้/ลบ) — ใช้ใน drawer ของรอบที่เลือกอยู่ ──
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const editingItem = selectedRound?.items?.find((it) => it._id === editingItemId) ?? null;

  const openAddItem = () => { setEditingItemId(null); setItemFormOpen(true); };
  const openEditItem = (itemId: string) => { setEditingItemId(itemId); setItemFormOpen(true); };
  const closeItemForm = () => setItemFormOpen(false);

  const addRoundItem = useMutation({
    mutationFn: ({ roundId, body }: { roundId: string; body: RoundItemInput }) => preorderRoundsService.addItem(roundId, body),
    onSuccess: () => { alert.success(t("preorderRound.itemAdded")); invalidateRounds(selectedRoundId); setItemFormOpen(false); },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.itemSaveFailed")),
  });

  const updateRoundItem = useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: UpdateRoundItemInput }) => preorderRoundsService.updateItem(itemId, body),
    onSuccess: () => { alert.success(t("preorderRound.itemUpdated")); invalidateRounds(selectedRoundId); setItemFormOpen(false); },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.itemSaveFailed")),
  });

  const removeRoundItem = useMutation({
    mutationFn: (itemId: string) => preorderRoundsService.removeItem(itemId),
    onSuccess: () => { alert.success(t("preorderRound.itemRemoved")); invalidateRounds(selectedRoundId); },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.itemRemoveFailed")),
  });

  const onSubmitItemForm = (roundId: string, body: RoundItemInput) => {
    if (editingItemId) updateRoundItem.mutate({ itemId: editingItemId, body });
    else addRoundItem.mutate({ roundId, body });
  };

  // ══════════════════ แท็บ 2: คำสั่งซื้อเค้กวันเกิด (Preorders) ══════════════════
  const preordersQ = useQuery({ queryKey: ["preorders"], queryFn: () => preordersService.list({ limit: 200 }) });
  const preorders = useMemo(() => preordersQ.data?.data ?? [], [preordersQ.data]);

  const [orderSearch, setOrderSearchState] = useState("");
  const [orderStatusFilter, setOrderStatusFilterState] = useState<OrderStatus | "all">("all");
  const [orderRoundFilter, setOrderRoundFilterState] = useState<string>("all");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);

  const ordersFiltered = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return preorders.filter((o) => {
      const matchSearch = !q || o.preorder_no.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q);
      const matchStatus = orderStatusFilter === "all" || o.order_status === orderStatusFilter;
      const matchRound = orderRoundFilter === "all" || o.round_id === orderRoundFilter;
      return matchSearch && matchStatus && matchRound;
    });
  }, [preorders, orderSearch, orderStatusFilter, orderRoundFilter]);

  const orderRows = useMemo(
    () => ordersFiltered.slice((orderPage - 1) * orderPageSize, orderPage * orderPageSize),
    [ordersFiltered, orderPage, orderPageSize],
  );

  const orderStats = useMemo(() => ({
    total: preorders.length,
    pending: preorders.filter((o) => o.order_status === "pending").length,
    inProgress: preorders.filter((o) => ["confirmed", "preparing", "ready"].includes(o.order_status)).length,
    completed: preorders.filter((o) => o.order_status === "completed").length,
  }), [preorders]);

  const roundOptions = useMemo(() => rounds.map((r) => ({ value: r._id, label: r.round_name })), [rounds]);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);
  const orderDetailQ = useQuery({
    queryKey: ["preorders", "detail", selectedOrderId],
    queryFn: () => preordersService.get(selectedOrderId as string),
    enabled: !!selectedOrderId && orderDrawerOpen,
  });
  const selectedOrder = orderDetailQ.data?.data ?? null;

  const onViewOrder = (o: Preorder) => { setSelectedOrderId(o._id); setOrderDrawerOpen(true); };
  const closeOrderDrawer = () => setOrderDrawerOpen(false);

  const invalidateOrders = () => {
    qc.invalidateQueries({ queryKey: ["preorders"] });
    qc.invalidateQueries({ queryKey: ["preorders", "detail", selectedOrderId] });
  };

  const changeOrderStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      preordersService.updateStatus(id, status, reason),
    onSuccess: invalidateOrders,
  });

  const onAdvanceOrderStatus = (o: Preorder) => {
    const next = getNextOrderStatus(o.order_status);
    if (!next) return;
    changeOrderStatus.mutate(
      { id: o._id, status: next },
      {
        onSuccess: () => alert.success(t("preorderRound.orderStatusChanged", { no: o.preorder_no, status: t(`enums.orderStatus.${next}`) })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.orderStatusChangeFailed")),
      },
    );
  };

  const onCancelOrder = (o: Preorder) => {
    changeOrderStatus.mutate(
      { id: o._id, status: "cancelled" },
      {
        onSuccess: () => alert.success(t("preorderRound.orderCancelled", { no: o.preorder_no })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.orderCancelFailed")),
      },
    );
  };

  return {
    t, locale, perm,
    activeTab, setActiveTab,
    preorderProducts,

    // แท็บ 1: รอบ
    rounds,
    roundSearch, setRoundSearch: (v: string) => { setRoundSearchState(v); setRoundPage(1); },
    roundStatusFilter, setRoundStatusFilter: (v: RoundStatus | "all") => { setRoundStatusFilterState(v); setRoundPage(1); },
    roundPage, roundPageSize, setRoundPagination: (p: number, ps: number) => { setRoundPage(p); setRoundPageSize(ps); },
    roundRows, roundTotal: roundsFiltered.length, roundStats,
    isRoundsLoading: roundsQ.isLoading, isRoundsError: roundsQ.isError, refetchRounds: () => roundsQ.refetch(),

    createRoundOpen, openCreateRound: () => setCreateRoundOpen(true), closeCreateRound: () => setCreateRoundOpen(false),
    onCreateRoundSubmit: (v: CreateRoundInput) => createRound.mutate(v), creatingRound: createRound.isPending,

    selectedRound, roundDrawerOpen, isRoundDetailLoading: roundDetailQ.isLoading,
    onViewRound, closeRoundDrawer,

    editRoundOpen, openEditRound: () => setEditRoundOpen(true), closeEditRound: () => setEditRoundOpen(false),
    onEditRoundSubmit: (body: UpdateRoundInput) => selectedRound && updateRound.mutate({ id: selectedRound._id, body }),
    savingRound: updateRound.isPending,

    isFinalRoundStatus, getNextRoundStatus,
    onAdvanceRoundStatus, onCancelRound, onDeleteRound: (id: string) => deleteRound.mutate(id),

    itemFormOpen, editingItem, openAddItem, openEditItem, closeItemForm,
    onSubmitItemForm, savingItem: addRoundItem.isPending || updateRoundItem.isPending,
    onRemoveRoundItem: (itemId: string) => removeRoundItem.mutate(itemId),

    // แท็บ 2: คำสั่งซื้อเค้กวันเกิด
    orderSearch, setOrderSearch: (v: string) => { setOrderSearchState(v); setOrderPage(1); },
    orderStatusFilter, setOrderStatusFilter: (v: OrderStatus | "all") => { setOrderStatusFilterState(v); setOrderPage(1); },
    orderRoundFilter, setOrderRoundFilter: (v: string) => { setOrderRoundFilterState(v); setOrderPage(1); },
    orderPage, orderPageSize, setOrderPagination: (p: number, ps: number) => { setOrderPage(p); setOrderPageSize(ps); },
    orderRows, orderTotal: ordersFiltered.length, orderStats, roundOptions,
    isOrdersLoading: preordersQ.isLoading, isOrdersError: preordersQ.isError, refetchOrders: () => preordersQ.refetch(),

    selectedOrder, orderDrawerOpen, isOrderDetailLoading: orderDetailQ.isLoading,
    onViewOrder, closeOrderDrawer,

    isFinalOrderStatus, getNextOrderStatus,
    onAdvanceOrderStatus, onCancelOrder,
  };
}
