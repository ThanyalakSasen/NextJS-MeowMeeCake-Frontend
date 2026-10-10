"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Pre-order Round — 3 แท็บ (รอบพรีออเดอร์ / สรุปรอบ / คำสั่งซื้อเค้กวันเกิด) sync กับ ?tab=
// แท็บ "สรุปรอบ" (F4) มี ViewModel ของตัวเอง (useRoundDashboardViewModel) ประกอบเข้ามาเป็น vm.dashboard
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
import { paymentsService } from "@/services/payments";
import { usePermission } from "@/context/PermissionsContext";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { OrderStatus, RoundStatus } from "@/constants/enumConfig";
import type { PreorderRound, CreateRoundInput, RoundItemInput, UpdateRoundInput, UpdateRoundItemInput } from "@/types/preorderRound";
import type { Preorder } from "@/types/preorder";
import type { DeliveryUpdateInput } from "@/types/order";
import { formatCurrency } from "@/i18n/format";
import { getNextRoundStatus, isFinalRoundStatus, getNextOrderStatus, isFinalOrderStatus, paymentDueState } from "./preorderStatus";
import { LIST_ALL } from "@/lib/http";
import { useRoundDashboardViewModel } from "./useRoundDashboardViewModel";

export type TabKey = "rounds" | "dashboard" | "orders";
const TAB_KEYS: TabKey[] = ["rounds", "dashboard", "orders"];

export function usePreOrderRoundViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("preorder"); // backend เช็ค menu_key "preorder" กับ /admin/preorder-rounds + /admin/preorders
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  // ?id=<preorderId> (ลิงก์จากแจ้งเตือน/LINE — BACKLOG2 §8) เปิด drawer พรีออเดอร์นั้น · ไม่ระบุ tab มา = ไปแท็บคำสั่งซื้อ
  const urlOrderId = searchParams.get("id");
  const activeTab: TabKey = TAB_KEYS.includes(tabParam as TabKey) ? (tabParam as TabKey) : urlOrderId ? "orders" : "rounds";
  const setActiveTab = (key: string) => router.replace(`/owner/orders/preOrderRound?tab=${key}`, { scroll: false });
  // แท็บสรุปรอบ — โหลดเมื่อเปิดแท็บนี้ครั้งแรก
  const dashboard = useRoundDashboardViewModel(activeTab === "dashboard");

  // ── สินค้าพรีออเดอร์ (ใช้เป็นตัวเลือกตอนเพิ่มสินค้าเข้ารอบ) ──
  const productsQ = useQuery({
    queryKey: ["products", "preorder-type"],
    queryFn: () => productsService.list({ limit: LIST_ALL, is_preorder: true }),
  });
  const preorderProducts = productsQ.data?.data ?? [];

  // ══════════════════ แท็บ 1: รอบพรีออเดอร์ ══════════════════
  const roundsQ = useQuery({ queryKey: ["preorder-rounds"], queryFn: () => preorderRoundsService.list({ limit: LIST_ALL }) });
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
  const preordersQ = useQuery({ queryKey: ["preorders"], queryFn: () => preordersService.list({ limit: LIST_ALL }) });
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

  // drawer พรีออเดอร์ผูกกับ ?id= (แพทเทิร์นเดียวกับ Manage Orders) — ดึงรายตัวด้วย id จึงเปิดได้แม้ไม่อยู่ในหน้าตาราง
  // · จำ id ล่าสุดไว้แม้ปิดแล้ว (เนื้อหาไม่หายวูบระหว่าง animation ปิด) — ปรับ state ระหว่าง render ตอน id ใน URL เปลี่ยน
  const orderDrawerOpen = !!urlOrderId;
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(urlOrderId);
  if (urlOrderId && urlOrderId !== selectedOrderId) setSelectedOrderId(urlOrderId);
  const orderDetailQ = useQuery({
    queryKey: ["preorders", "detail", selectedOrderId],
    queryFn: () => preordersService.get(selectedOrderId as string),
    enabled: !!selectedOrderId && orderDrawerOpen,
  });
  const selectedOrder = orderDetailQ.data?.data ?? null;

  // ── การชำระเงินของพรีออเดอร์ (backend #55) — ใบผลิตนับเฉพาะพรีออเดอร์ที่จ่ายแล้ว และที่ยังไม่จ่ายเมื่อเลย
  //    payment_due_at / ปิดรอบ ถูกยกเลิกอัตโนมัติ → แอดมินต้องตรวจสลิปจากหน้านี้ได้ (เดิมไม่มีทางยืนยันเลย)
  //    สลิป/สถานะอยู่ที่ resource Payments ไม่ใช่ field บน preorder (เหมือน Manage Orders)
  const paymentPerm = usePermission("payments");
  const paymentQ = useQuery({
    queryKey: ["payments", "by-preorder", selectedOrderId],
    queryFn: () => paymentsService.listByPreorder(selectedOrderId as string),
    enabled: !!selectedOrderId && orderDrawerOpen && paymentPerm.view,
  });
  const selectedPayment = paymentQ.data?.data[0] ?? null; // ใหม่สุดก่อน
  // รายการที่ชำระแล้ว — ใช้คืนเงินเมื่อ "ยกเลิก + ชำระแล้ว" (backend คืนพรีออเดอร์อัตโนมัติตอนยกเลิก แต่ข้อมูลที่
  // backend ฝั่งลูกค้า (พอร์ต 4000) ยกเลิกไว้ / คืนอัตโนมัติไม่สำเร็จ อาจค้างสถานะนี้ — ให้ร้านปิดเองได้)
  const paidPayment = paymentQ.data?.data.find((p) => p.status === "paid") ?? null;

  const refundPayment = useMutation({
    mutationFn: (paymentId: string) => paymentsService.refund(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preorders"] });
      qc.invalidateQueries({ queryKey: ["payments", "by-preorder", selectedOrderId] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const onRefund = async (paymentId: string) => {
    if (!selectedOrder) return;
    const no = selectedOrder.preorder_no;
    const ok = await confirmAlert(
      t("orders.refundConfirm", { amount: formatCurrency(selectedOrder.total_amount, locale), no }),
      { title: t("orders.confirmRefund"), confirmText: t("orders.confirmRefund"), cancelText: t("common.cancel") },
    );
    if (!ok) return;
    refundPayment.mutate(paymentId, {
      onSuccess: () => alert.success(t("orders.refunded", { no })),
      onError: (e) => alert.error(isApiError(e) ? e.message : t("orders.refundFailed")),
    });
  };

  const verifyPayment = useMutation({
    mutationFn: ({ paymentId, approved }: { paymentId: string; approved: boolean }) =>
      paymentsService.verify(paymentId, approved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preorders"] });
      qc.invalidateQueries({ queryKey: ["payments", "by-preorder", selectedOrderId] });
      qc.invalidateQueries({ queryKey: ["reports"] }); // ชำระแล้ว/ไม่ผ่าน เปลี่ยนรายรับในหน้าสรุปการเงิน
    },
  });

  const onApprovePayment = (paymentId: string) => {
    verifyPayment.mutate(
      { paymentId, approved: true },
      {
        onSuccess: () => alert.success(t("orders.paymentVerified", { no: selectedOrder?.preorder_no ?? "" })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("orders.paymentVerifyFailed")),
      },
    );
  };

  // ปฏิเสธ = payment "failed" — ลูกค้าแนบสลิปใหม่ได้ (กลับมา pending) แต่ถ้าเลยกำหนดชำระแล้วจะถูกยกเลิกอัตโนมัติ
  const onRejectPayment = async (paymentId: string) => {
    const ok = await confirmAlert(t("preorderRound.rejectPaymentConfirm"), {
      title: t("preorderRound.rejectPayment"),
      confirmText: t("preorderRound.rejectPayment"),
      danger: true,
    });
    if (!ok) return;
    verifyPayment.mutate(
      { paymentId, approved: false },
      {
        onSuccess: () => alert.success(t("preorderRound.paymentRejected", { no: selectedOrder?.preorder_no ?? "" })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.paymentRejectFailed")),
      },
    );
  };

  const onViewOrder = (o: Preorder) =>
    router.replace(`/owner/orders/preOrderRound?tab=orders&id=${encodeURIComponent(o._id)}`, { scroll: false });
  const closeOrderDrawer = () => router.replace(`/owner/orders/preOrderRound?tab=${activeTab}`, { scroll: false });

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

  // สถานะจัดส่ง/เลขพัสดุ (BACKLOG2 §15.2 ข้อ 3) — เฉพาะพรีออเดอร์แบบจัดส่ง · backend แจ้งลูกค้าเองเมื่อสถานะเปลี่ยน
  const deliveryMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DeliveryUpdateInput }) => preordersService.updateDelivery(id, input),
    onSuccess: invalidateOrders,
  });

  const onSaveDelivery = (input: DeliveryUpdateInput) => {
    if (!selectedOrder) return;
    const no = selectedOrder.preorder_no;
    deliveryMutation.mutate(
      { id: selectedOrder._id, input },
      {
        onSuccess: () => alert.success(t("orders.deliverySaved", { no })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("orders.deliverySaveFailed")),
      },
    );
  };

  return {
    t, locale, perm,
    onSaveDelivery,
    savingDelivery: deliveryMutation.isPending,
    activeTab, setActiveTab,
    preorderProducts,
    dashboard,

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

    selectedOrder, orderDrawerOpen, isOrderDetailLoading: orderDetailQ.isLoading || paymentQ.isLoading,
    isOrderDetailError: orderDetailQ.isError,
    selectedPayment, canViewPayment: paymentPerm.view, canApprovePayment: paymentPerm.approve,
    verifyingPayment: verifyPayment.isPending, onApprovePayment, onRejectPayment,
    paidPayment, onRefund, refunding: refundPayment.isPending,
    onViewOrder, closeOrderDrawer,

    isFinalOrderStatus, getNextOrderStatus, paymentDueState,
    onAdvanceOrderStatus, onCancelOrder,
  };
}
