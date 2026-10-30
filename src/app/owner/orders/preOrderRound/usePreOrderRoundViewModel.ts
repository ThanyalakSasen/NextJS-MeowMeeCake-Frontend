"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Pre-order Round — 3 แท็บ (สรุปรอบ · ค่าเริ่มต้น / รอบพรีออเดอร์ / คำสั่งซื้อพรีออเดอร์) sync กับ ?tab=
// แท็บ "สรุปรอบ" (F4) มี ViewModel ของตัวเอง (useRoundDashboardViewModel) ประกอบเข้ามาเป็น vm.dashboard
// ผ่าน router (แพทเทิร์นเดียวกับ Production) · โหลดรอบ+พรีออเดอร์ทั้งหมด 1 ครั้งต่อแท็บ แล้วกรอง/
// แบ่งหน้าฝั่ง client เหมือน Manage Orders/Production
//
// permission gate ใช้ "preorder" ตรงกับที่ backend เช็คจริงใน withPermission ของ /admin/preorder-rounds
// และ /admin/preorders (constants/menuKeys.ts มี "preorder" ครบ และหน้าจัดการสิทธิ์ให้สิทธิ์นี้ได้แล้ว)
// path หน้านี้ map เป็น "preorder" ใน ROUTE_MENU_MAP ส่วน "/owner/orders" ที่เหลือยังเป็น "orders"
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { preorderRoundsService } from "@/services/preorderRounds";
import { preordersService } from "@/services/preorders";
import { productsService } from "@/services/products";
import { paymentsService } from "@/services/payments";
import { productionOrdersService } from "@/services/productionOrders";
import { usePermission } from "@/context/PermissionsContext";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { OrderStatus, RoundStatus } from "@/constants/enumConfig";
import type { PreorderRound, CloseRoundResult, CreateRoundInput, RoundItemInput, UpdateRoundInput, UpdateRoundItemInput } from "@/types/preorderRound";
import type { Preorder } from "@/types/preorder";
import type { DeliveryUpdateInput, OrderType } from "@/types/order";
import { formatCurrency } from "@/i18n/format";
import { getNextRoundStatus, isFinalRoundStatus, getNextOrderStatus, isFinalOrderStatus, paymentDueState } from "./preorderStatus";
import { LIST_ALL } from "@/lib/http";
import { PREORDERS_KEY, ROUNDS_KEY, fetchPreorders, preorderSearchKey, tabFrom, type TabKey } from "./preorderQuery";
import { useRoundDashboardViewModel } from "./useRoundDashboardViewModel";
import { useMarkShipped } from "@/components/shared/orders";

export type { TabKey };

const DAY_MS = 24 * 60 * 60 * 1000;

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
  const activeTab: TabKey = tabFrom(tabParam, urlOrderId);
  const setActiveTab = (key: string) => router.replace(`/owner/orders/preOrderRound?tab=${key}`, { scroll: false });
  // แท็บสรุปรอบ — โหลดเมื่อเปิดแท็บนี้ครั้งแรก
  const dashboard = useRoundDashboardViewModel(activeTab === "dashboard");

  // พรีออเดอร์ (ที่ยังไม่ปิดงานครบทุกตัว + ล่าสุด) — ใช้ทั้งแท็บคำสั่งซื้อ และนับยอดค้างในรอบตอนยืนยันปิด/ยกเลิกรอบ · ดู fetchPreorders
  const preordersQ = useQuery({ queryKey: PREORDERS_KEY, queryFn: () => fetchPreorders() });
  const loadedPreorders = useMemo(() => preordersQ.data?.data ?? [], [preordersQ.data]);
  const olderPreordersHidden = preordersQ.data?.olderHidden ?? false;

  // ══════════════════ แท็บ 1: รอบพรีออเดอร์ ══════════════════
  const roundsQ = useQuery({ queryKey: ROUNDS_KEY, queryFn: () => preorderRoundsService.list({ limit: LIST_ALL }) });
  const rounds = useMemo(() => roundsQ.data?.data ?? [], [roundsQ.data]);

  // รอบเปิด/ปิดเองตามเวลา (backend syncRoundSchedule ตอนอ่านรอบ) — เปิดหน้าค้างไว้จนถึงเวลาปิดรับ/เปิดรับของรอบใด
  // → โหลดรอบ + พรีออเดอร์ (คนไม่จ่ายถูกยกเลิก) + ใบผลิต (สร้างตอนปิดรอบ) ใหม่ ให้สถานะบนจอตรงกับจริงโดยไม่ต้องรีเฟรช
  useEffect(() => {
    const now = Date.now();
    const next = Math.min(
      ...rounds.flatMap((r) => [
        r.round_status === "scheduled" ? new Date(r.open_date).getTime() : Infinity,
        r.round_status === "open" || r.round_status === "scheduled" ? new Date(r.close_date).getTime() : Infinity,
      ]).filter((ts) => ts > now),
    );
    if (!Number.isFinite(next) || next - now > DAY_MS) return; // เกิน 1 วัน — ไม่ตั้ง (setTimeout รับได้ไม่ถึงเดือน)
    const timer = setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["preorder-rounds"] });
      qc.invalidateQueries({ queryKey: ["preorders"] });
      qc.invalidateQueries({ queryKey: ["production-orders"] });
    }, next - now + 2000);
    return () => clearTimeout(timer);
  }, [rounds, qc]);

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
  // เปิดได้ 2 ทาง: ปุ่มในตาราง (ส่งแถวมา) · ปุ่มในหน้าต่างรายละเอียด (ใช้รอบที่เปิดดูอยู่)
  // เก็บรอบที่แก้ไว้หลังปิด — modal ยังต้องมีข้อมูลระหว่าง animation ปิด
  const [editRoundOpen, setEditRoundOpen] = useState(false);
  const [editRoundTarget, setEditRoundTarget] = useState<PreorderRound | null>(null);
  const updateRound = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRoundInput }) => preorderRoundsService.update(id, body),
    onSuccess: () => {
      alert.success(t("preorderRound.updated"));
      invalidateRounds(editRoundTarget?._id);
      setEditRoundOpen(false);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.updateFailed")),
  });

  // ── ใบสั่งผลิตของรอบที่เปิดดูอยู่ (เฉพาะรอบที่ปิดรับแล้ว) — ลิงก์ตรงไปที่ใบ + ใช้ตัดสินว่าเปิดรอบกลับได้ไหม
  //    (backend ให้เปิดกลับได้เฉพาะรอบที่ยังไม่มีใบสั่งผลิตที่ไม่ถูกยกเลิก) · ไม่มีสิทธิ์ดูการผลิต = ไม่รู้ → ให้ backend ตัดสิน
  const productionPerm = usePermission("production");
  const roundProductionQ = useQuery({
    queryKey: ["production-orders", "by-round", selectedRoundId],
    queryFn: () => productionOrdersService.list({ round_id: selectedRoundId as string, limit: LIST_ALL }),
    enabled: !!selectedRoundId && roundDrawerOpen && productionPerm.view && selectedRound?.round_status === "closed",
  });
  const roundProduction = roundProductionQ.data?.data.find((p) => p.production_status !== "cancelled") ?? null;

  /** ยอดพรีออเดอร์ที่ยังค้างในรอบ — บอกในกล่องยืนยันว่าปิด/ยกเลิกรอบแล้วจะกระทบกี่รายการ */
  const roundOrderCounts = (roundId: string) => {
    const active = loadedPreorders.filter((o) => o.round_id === roundId && !isFinalOrderStatus(o.order_status));
    const paid = active.filter((o) => o.payment_status === "paid").length;
    return { active: active.length, paid, unpaid: active.length - paid };
  };

  // ผลการปิดรอบล่าสุด (ใบสั่งผลิตที่ได้ · ยกเลิกคนไม่จ่ายกี่ราย) — โชว์ใน drawer ของรอบนั้นจนกว่าจะปิดหน้า
  const [closeResult, setCloseResult] = useState<{ roundId: string; result: CloseRoundResult } | null>(null);

  // เปลี่ยนสถานะรอบ (เดินหน้าทีละสถานะ) + ยกเลิก + เปิดรอบที่ปิดแล้วกลับ
  const changeRoundStatus = useMutation({
    mutationFn: ({ id, status, close_date }: { id: string; status: RoundStatus; close_date?: string }) =>
      preorderRoundsService.updateStatus(id, status, { close_date }),
    onSuccess: () => {
      invalidateRounds(selectedRoundId);
      // ปิด/ยกเลิกรอบ → พรีออเดอร์ถูกยกเลิก + ใบสั่งผลิตถูกสร้าง ฝั่ง backend
      qc.invalidateQueries({ queryKey: ["preorders"] });
      qc.invalidateQueries({ queryKey: ["production-orders"] });
    },
  });

  const onAdvanceRoundStatus = async (round: PreorderRound) => {
    const next = getNextRoundStatus(round.round_status);
    if (!next) return;
    if (next === "closed") {
      const c = roundOrderCounts(round._id);
      const ok = await confirmAlert(t("preorderRound.closeConfirm", { unpaid: c.unpaid, paid: c.paid }), {
        title: t("preorderRound.closeConfirmTitle", { name: round.round_name }),
        confirmText: t("preorderRound.closeRound"),
        cancelText: t("common.cancel"),
      });
      if (!ok) return;
    }
    changeRoundStatus.mutate(
      { id: round._id, status: next },
      {
        onSuccess: ({ closeResult: result }) => {
          alert.success(t("preorderRound.statusChanged", { name: round.round_name, status: t(`enums.roundStatus.${next}`) }));
          if (result) setCloseResult({ roundId: round._id, result });
        },
        onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.statusChangeFailed")),
      },
    );
  };

  const onCancelRound = async (round: PreorderRound) => {
    const c = roundOrderCounts(round._id);
    const ok = await confirmAlert(t("preorderRound.cancelRoundConfirm", { active: c.active, paid: c.paid }), {
      title: t("preorderRound.cancelRoundConfirmTitle", { name: round.round_name }),
      confirmText: t("preorderRound.cancelRound"),
      cancelText: t("common.back"),
      danger: true,
    });
    if (!ok) return;
    changeRoundStatus.mutate(
      { id: round._id, status: "cancelled" },
      {
        onSuccess: ({ cancelCascade }) => {
          alert.success(t("preorderRound.cancelledWithOrders", { name: round.round_name, n: cancelCascade?.cancelled.length ?? 0 }));
          if (cancelCascade?.failed.length) {
            alert.warning(
              t("preorderRound.cancelCascadeFailed", { list: cancelCascade.failed.map((f) => f.preorder_no).join(", ") }),
            );
          }
        },
        onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.cancelFailed")),
      },
    );
  };

  // เปิดรอบที่ปิดแล้วกลับ — ต้องได้วันปิดรับใหม่ถ้าวันเดิมผ่านไปแล้ว (ไม่งั้นตัวตั้งเวลาปิดซ้ำทันที)
  const [reopenOpen, setReopenOpen] = useState(false);
  const onReopenSubmit = (closeDate: string) => {
    if (!selectedRound) return;
    const round = selectedRound;
    changeRoundStatus.mutate(
      { id: round._id, status: "open", close_date: closeDate },
      {
        onSuccess: () => {
          alert.success(t("preorderRound.reopened", { name: round.round_name }));
          setReopenOpen(false);
          setCloseResult(null);
        },
        onError: (e) => alert.error(isApiError(e) ? e.message : t("preorderRound.statusChangeFailed")),
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

  // ── สินค้าพรีออเดอร์ (ตัวเลือกในฟอร์มสร้างรอบ/เพิ่มสินค้าเข้ารอบ) — ดึงเมื่อเปิดฟอร์มเท่านั้น ·
  // เดิมดึงตอนโหลดหน้า ข้อมูลมาถึงทีหลัง → ทั้งหน้าวาดใหม่อีกรอบระหว่างโหลด (เพิ่ม TBT) ทั้งที่ยังไม่มีใครเปิดฟอร์ม
  const productsQ = useQuery({
    queryKey: ["products", "preorder-type"],
    queryFn: () => productsService.list({ limit: LIST_ALL, is_preorder: true }),
    enabled: createRoundOpen || itemFormOpen,
  });
  const preorderProducts = productsQ.data?.data ?? [];

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

  // ══════════════════ แท็บ 2: คำสั่งซื้อพรีออเดอร์ (Preorders) ══════════════════

  const [orderSearch, setOrderSearchState] = useState("");
  const [orderStatusFilter, setOrderStatusFilterState] = useState<OrderStatus | "all">("all");
  const [orderRoundFilter, setOrderRoundFilterState] = useState<string>("all");
  const [orderTypeFilter, setOrderTypeFilterState] = useState<OrderType | "all">("all");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);

  // พรีออเดอร์ปิดงานแล้วที่เก่ากว่ารายการที่โหลดไว้ — ค้นเลขพรีออเดอร์ที่ backend แล้วรวมเข้าตาราง (backend ค้นได้แค่เลขพรีออเดอร์)
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setOrderSearchTerm(orderSearch.trim()), 300);
    return () => clearTimeout(id);
  }, [orderSearch]);
  const remoteSearchQ = useQuery({
    queryKey: preorderSearchKey(orderSearchTerm),
    queryFn: () => preordersService.list({ search: orderSearchTerm, limit: 50 }),
    enabled: olderPreordersHidden && orderSearchTerm.length >= 3,
  });
  const preorders = useMemo(() => {
    const extra = (remoteSearchQ.data?.data ?? []).filter((o) => !loadedPreorders.some((x) => x._id === o._id));
    return extra.length ? [...loadedPreorders, ...extra] : loadedPreorders;
  }, [loadedPreorders, remoteSearchQ.data]);

  const ordersFiltered = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return preorders.filter((o) => {
      const matchSearch = !q || o.preorder_no.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q);
      const matchStatus = orderStatusFilter === "all" || o.order_status === orderStatusFilter;
      const matchRound = orderRoundFilter === "all" || o.round_id === orderRoundFilter;
      const matchType = orderTypeFilter === "all" || o.order_type === orderTypeFilter;
      return matchSearch && matchStatus && matchRound && matchType;
    });
  }, [preorders, orderSearch, orderStatusFilter, orderRoundFilter, orderTypeFilter]);

  const orderRows = useMemo(
    () => ordersFiltered.slice((orderPage - 1) * orderPageSize, orderPage * orderPageSize),
    [ordersFiltered, orderPage, orderPageSize],
  );

  // ทั้งหมด/สำเร็จ = ยอดจริงจาก backend (รายการที่โหลดอาจไม่ครบประวัติ) · รอ/กำลังทำ = สถานะเปิด โหลดครบเสมอ
  const orderStats = useMemo(() => ({
    total: preordersQ.data?.total ?? 0,
    pending: loadedPreorders.filter((o) => o.order_status === "pending").length,
    inProgress: loadedPreorders.filter((o) => ["confirmed", "preparing", "ready"].includes(o.order_status)).length,
    completed: preordersQ.data?.completed ?? 0,
  }), [preordersQ.data, loadedPreorders]);

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

  // ยกเลิกต้องยืนยัน + กรอกเหตุผลก่อนเสมอ (CancelOrderModal เดียวกับหน้าจัดการคำสั่งซื้อ) — เดิมกดปุ่มเดียวยกเลิกทันที
  const [cancelTarget, setCancelTarget] = useState<Preorder | null>(null);
  const onCancelOrder = (o: Preorder) => setCancelTarget(o);

  const onConfirmCancelOrder = (reason: string) => {
    const o = cancelTarget;
    if (!o) return;
    changeOrderStatus.mutate(
      { id: o._id, status: "cancelled", reason },
      {
        onSuccess: () => {
          alert.success(t("preorderRound.orderCancelled", { no: o.preorder_no }));
          setCancelTarget(null);
        },
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

  // "จัดส่งเรียบร้อยแล้ว" — ใช้ร่วมกับหน้าจัดการคำสั่งซื้อ (shared/orders/useMarkShipped)
  const { markShippedFor, markingShipped } = useMarkShipped(preordersService, invalidateOrders);
  const onMarkShipped = (changes?: DeliveryUpdateInput) => selectedOrder && markShippedFor(selectedOrder, selectedOrder.preorder_no, changes);

  return {
    t, locale, perm,
    onSaveDelivery,
    savingDelivery: deliveryMutation.isPending,
    onMarkShipped, markingShipped,
    activeTab, setActiveTab,
    preorderProducts,
    dashboard,

    // แท็บ 1: รอบ
    rounds,
    roundSearch, setRoundSearch: (v: string) => { setRoundSearchState(v); setRoundPage(1); },
    roundStatusFilter, setRoundStatusFilter: (v: RoundStatus | "all") => { setRoundStatusFilterState(v); setRoundPage(1); },
    roundPage, roundPageSize, setRoundPagination: (p: number, ps: number) => { setRoundPage(p); setRoundPageSize(ps); },
    roundRows, roundTotal: roundsFiltered.length, roundStats,
    // isPending (ไม่ใช่ isLoading) — หน้านี้ render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
    isRoundsLoading: roundsQ.isPending, isRoundsError: roundsQ.isError, refetchRounds: () => roundsQ.refetch(),

    createRoundOpen, openCreateRound: () => setCreateRoundOpen(true), closeCreateRound: () => setCreateRoundOpen(false),
    onCreateRoundSubmit: (v: CreateRoundInput) => createRound.mutate(v), creatingRound: createRound.isPending,

    selectedRound, roundDrawerOpen, isRoundDetailLoading: roundDetailQ.isLoading,
    onViewRound, closeRoundDrawer,

    editRoundOpen, editRoundTarget,
    openEditRound: (r?: PreorderRound) => {
      const target = r ?? selectedRound;
      if (!target) return;
      setEditRoundTarget(target);
      setEditRoundOpen(true);
    },
    closeEditRound: () => setEditRoundOpen(false),
    onEditRoundSubmit: (body: UpdateRoundInput) => editRoundTarget && updateRound.mutate({ id: editRoundTarget._id, body }),
    savingRound: updateRound.isPending,

    isFinalRoundStatus, getNextRoundStatus,
    onAdvanceRoundStatus, onCancelRound, changingRoundStatus: changeRoundStatus.isPending,
    roundProduction, canViewProduction: productionPerm.view,
    closeResult: closeResult && selectedRound && closeResult.roundId === selectedRound._id ? closeResult.result : null,
    // เปิดกลับได้เมื่อรู้ว่ายังไม่มีใบสั่งผลิต (ไม่มีสิทธิ์ดูการผลิต → ให้กดได้ backend ตอบ 409 ถ้ามีใบแล้ว)
    canReopenRound: !!selectedRound && selectedRound.round_status === "closed" && !roundProduction
      && (!productionPerm.view || roundProductionQ.isSuccess),
    reopenOpen, openReopen: () => setReopenOpen(true), closeReopen: () => setReopenOpen(false), onReopenSubmit, onDeleteRound: (id: string) => deleteRound.mutate(id),

    itemFormOpen, editingItem, openAddItem, openEditItem, closeItemForm,
    onSubmitItemForm, savingItem: addRoundItem.isPending || updateRoundItem.isPending,
    onRemoveRoundItem: (itemId: string) => removeRoundItem.mutate(itemId),

    // แท็บ 2: คำสั่งซื้อพรีออเดอร์
    orderSearch, setOrderSearch: (v: string) => { setOrderSearchState(v); setOrderPage(1); },
    orderStatusFilter, setOrderStatusFilter: (v: OrderStatus | "all") => { setOrderStatusFilterState(v); setOrderPage(1); },
    orderRoundFilter, setOrderRoundFilter: (v: string) => { setOrderRoundFilterState(v); setOrderPage(1); },
    orderTypeFilter, setOrderTypeFilter: (v: OrderType | "all") => { setOrderTypeFilterState(v); setOrderPage(1); },
    orderPage, orderPageSize, setOrderPagination: (p: number, ps: number) => { setOrderPage(p); setOrderPageSize(ps); },
    orderRows, orderTotal: ordersFiltered.length, orderStats, roundOptions, olderPreordersHidden,
    isOrdersLoading: preordersQ.isPending, isOrdersError: preordersQ.isError, refetchOrders: () => preordersQ.refetch(),

    selectedOrder, orderDrawerOpen, isOrderDetailLoading: orderDetailQ.isLoading || paymentQ.isLoading,
    isOrderDetailError: orderDetailQ.isError,
    selectedPayment, canViewPayment: paymentPerm.view, canApprovePayment: paymentPerm.approve,
    // คืนเงิน = payments.delete (ไม่ใช่ approve — Final-Backlog P7)
    canRefundPayment: paymentPerm.delete,
    verifyingPayment: verifyPayment.isPending, onApprovePayment, onRejectPayment,
    paidPayment, onRefund, refunding: refundPayment.isPending,
    onViewOrder, closeOrderDrawer,

    isFinalOrderStatus, getNextOrderStatus, paymentDueState,
    onAdvanceOrderStatus, onCancelOrder,
    cancelTarget, onConfirmCancelOrder, closeCancelOrder: () => setCancelTarget(null),
    cancellingOrder: changeOrderStatus.isPending,
  };
}
