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
import { LIST_ALL } from "@/lib/http";
import { unitsService } from "@/services/units";
import { usersService } from "@/services/users";
import { STAFF_KEY, STAFF_PARAMS } from "@/app/owner/employees/employeesQuery";
import { rolesService } from "@/services/roles";
import { recipesService } from "@/services/recipes";
import { preorderRoundsService } from "@/services/preorderRounds";
import { usePermission } from "@/context/PermissionsContext";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { refId } from "@/lib/refId";
import { unitLabel } from "@/utils/unitContext";
import type { ProductionStatus } from "@/constants/enumConfig";
import type { CompleteProductionValue } from "./_components/CompleteProductionModal";
import { thaiCompare } from "@/lib/thaiSort";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import { PRODUCTION_ORDERS_KEY, PRODUCTION_ORDERS_PARAMS, PRODUCTION_PRODUCTS_KEY, PRODUCTION_PRODUCTS_PARAMS, PRODUCTION_UNITS_KEY, tabFrom, type TabKey } from "./productionQuery";
import type {
  ProductionOrder, RawProductionOrder, CreateProductionOrderItemInput, ProductionOrderFromRoundInput,
} from "@/types/productionOrder";
import {
  isFinalStatus, getNextStatus, durationHours, producedQty,
} from "./productionStatus";


/** โหมดดูประวัติการผลิต — ชุดเดียวกับหน้ารายงานยอดขาย (วัน/สัปดาห์/เดือน/ไตรมาส/ปี — utils/period) */
export type HistoryViewMode = PeriodType;

export interface CreateProductionOrderValue {
  production_date: string;
  assigned_to: string | null;
  production_note: string | null;
  items: CreateProductionOrderItemInput[];
}

/** raw ใบสั่งผลิตจาก backend → ProductionOrder ของหน้า (ใช้ทั้ง list และใบที่ดึงรายตัวจาก ?id=) */
function toProductionOrder(
  o: RawProductionOrder,
  productsById: Map<string, { name: string; unit_abbr: string }>,
): ProductionOrder {
  return {
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
        shelf_life_days: typeof it.product_id === "object" && it.product_id ? (it.product_id.shelf_life_days ?? null) : null,
      };
    }),
  };
}

export function useProductionViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("production");
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  // ?id=<productionOrderId> (ลิงก์จากแจ้งเตือน/LINE — ปิดรอบ · จ่ายช้าหลังเริ่มผลิต · เพิ่ม/หักยอด — BACKLOG2 §8)
  // เปิด drawer ใบนั้น · ไม่ระบุ tab มา = แท็บสถานะ (ดูใบที่กำลังทำอยู่)
  const urlOrderId = searchParams.get("id");
  const activeTab: TabKey = tabFrom(tabParam, urlOrderId);
  const setActiveTab = (key: string) => router.replace(`/owner/production?tab=${key}`, { scroll: false });

  // ── shared data (โหลดครั้งเดียว ใช้ทั้ง 3 แท็บ) ──
  // ใบสั่งผลิต + สินค้า/หน่วย (เติมชื่อ/หน่วยให้รายการในใบ) — page.tsx ดึงไว้ฝั่ง server แล้ว (key ที่ productionQuery.ts)
  const ordersQ = useQuery({ queryKey: PRODUCTION_ORDERS_KEY, queryFn: () => productionOrdersService.list(PRODUCTION_ORDERS_PARAMS) });
  const productsQ = useQuery({ queryKey: PRODUCTION_PRODUCTS_KEY, queryFn: () => productsService.list(PRODUCTION_PRODUCTS_PARAMS) });
  const unitsQ = useQuery({ queryKey: PRODUCTION_UNITS_KEY, queryFn: () => unitsService.list() });

  // ฟอร์มสร้างใบสั่งผลิต — ประกาศก่อน query ด้านล่างที่ใช้เป็นตัวเลือกในฟอร์มเท่านั้น
  const [createOpen, setCreateOpen] = useState(false);
  const [createFromRoundOpen, setCreateFromRoundOpen] = useState(false);
  const formOpen = createOpen || createFromRoundOpen;
  // พนักงาน/role/สูตร/รอบที่ปิดแล้ว = ตัวเลือกในฟอร์มสร้างเท่านั้น — ดึงเมื่อเปิดฟอร์ม (เดิมดึงตอนเปิดหน้า 4 ก้อน
  // แต่ละก้อนมาถึงแล้วทั้งหน้าวาดใหม่อีกรอบระหว่างโหลด → TBT)
  // ทีมงานเท่านั้น (เจ้าของ+พนักงาน) — ชุดเดียวกับหน้าพนักงาน (แคชร่วม) · คนที่มีแค่สิทธิ์ผลิต backend ก็ให้เห็นแค่นี้
  const usersQ = useQuery({ queryKey: STAFF_KEY, queryFn: () => usersService.list(STAFF_PARAMS), enabled: formOpen });
  const rolesQ = useQuery({ queryKey: ["roles"], queryFn: () => rolesService.list(), enabled: formOpen });
  const recipesQ = useQuery({ queryKey: ["recipes"], queryFn: () => recipesService.list({ limit: LIST_ALL }), enabled: createOpen });
  // รอบพรีออเดอร์ที่ "ปิดรับแล้ว" — ตัวเลือกตอนสร้างใบสั่งผลิตจากรอบ (เฉพาะที่ยังไม่มีใบสั่งผลิตอยู่)
  const closedRoundsQ = useQuery({
    queryKey: ["preorder-rounds", "closed"],
    queryFn: () => preorderRoundsService.list({ status: "closed", limit: LIST_ALL }),
    enabled: createFromRoundOpen,
  });
  // รอบที่เลือกในฟอร์มสร้างจากรอบ → ดูล่วงหน้า (สินค้า/จำนวน/ยอดที่ไม่นับ/เหตุที่สร้างไม่ได้) ก่อนกดสร้าง
  const [fromRoundId, setFromRoundId] = useState<string | null>(null);
  // อยู่ใต้ PRODUCTION_ORDERS_KEY — invalidate() หลังสร้าง/ยกเลิกใบ ทำให้ preview สดตามไปด้วย
  const fromRoundPreviewQ = useQuery({
    queryKey: [...PRODUCTION_ORDERS_KEY, "from-round-preview", fromRoundId],
    queryFn: () => productionOrdersService.previewFromRound(fromRoundId as string),
    enabled: createFromRoundOpen && !!fromRoundId,
  });

  /** ชื่อ/หน่วยของทุกสินค้า (ไม่กรอง) — ใช้ enrich รายการของใบสั่งผลิตเก่าด้วย แม้สินค้านั้นจะไม่มีสูตรแล้วก็ตาม */
  const productsById = useMemo(() => {
    const unitMap = new Map((unitsQ.data?.data ?? []).map((u) => [u._id, unitLabel(u)]));
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

  const orders: ProductionOrder[] = useMemo(
    () => ((ordersQ.data?.data ?? []) as RawProductionOrder[]).map((o) => toProductionOrder(o, productsById)),
    [ordersQ.data, productsById],
  );

  /** ตัวเลือกสินค้าตอนสร้างใบสั่งผลิต — สินค้าทุกตัว (ปกติ + พรีออเดอร์) · ยังไม่มีสูตร = recipe_id null
   *  ฟอร์มแสดงแต่เลือกไม่ได้ (backend บังคับ recipe_id ต่อแถว — ใช้ตัดวัตถุดิบตอนผลิตเสร็จ) · เดิมซ่อนไปเลย ผู้ใช้ไม่รู้ว่าหายเพราะอะไร */
  const productOptions = useMemo(() => (
    (productsQ.data?.data ?? [])
      .map((p) => ({
        _id: p._id,
        name: productsById.get(p._id)?.name ?? p.product_name_th,
        unit_abbr: productsById.get(p._id)?.unit_abbr ?? "",
        recipe_id: recipeByProduct.get(p._id) ?? null,
      }))
      .sort((a, b) => thaiCompare(a.name, b.name))
  ), [productsQ.data, recipeByProduct, productsById]);

  /** พนักงานที่มอบหมายงานผลิตได้ — active + ไม่ใช่ role ลูกค้า */
  const staff = useMemo(() => {
    const customerRoleIds = new Set(
      (rolesQ.data?.data ?? []).filter((r) => r.role_type === "customer").map((r) => r._id),
    );
    return (usersQ.data?.data ?? []).filter((u) => u.emp_status && u.role_id && !customerRoleIds.has(u.role_id));
  }, [usersQ.data, rolesQ.data]);

  /** รอบที่มีใบสั่งผลิต (source_type preorder, ไม่ใช่ cancelled) ผูกอยู่แล้ว — backend อนุญาตแค่ 1 ใบต่อรอบ
   *  ฟอร์มโชว์รอบเหล่านี้ไว้ท้ายรายการแบบเลือกไม่ได้ (บอกว่ารอบหายไปไหน) · preview ยืนยันซ้ำจาก backend อีกชั้น */
  const roundsWithProduction = useMemo(
    () => new Set(
      orders.filter((o) => o.source_type === "preorder" && o.production_status !== "cancelled" && o.round_id)
        .map((o) => o.round_id as string),
    ),
    [orders],
  );
  const closedRounds = closedRoundsQ.data?.data ?? [];

  // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
  const isLoading = ordersQ.isPending;
  const isError = ordersQ.isError;
  const refetch = () => ordersQ.refetch();

  // ── แท็บ 1: แผนการผลิต ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductionStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  // ── วันนี้ผลิตอะไรบ้าง (หัวแท็บแผนการผลิต) — แสดงอย่างเดียว ไม่มีปุ่มเลื่อนสถานะ (ผู้ใช้ขอ 2026-10-29) ──
  // ใบที่วันผลิตตรงวันนี้และไม่ถูกยกเลิก · รวมจำนวนต่อสินค้า (สินค้าเดียวกันหลายใบ = บวกกัน) เรียงตามชื่อ
  const [today] = useState<Dayjs>(() => dayjs());
  const todayOrders = useMemo(
    () => orders.filter((o) => o.production_status !== "cancelled" && dayjs(o.production_date).isSame(today, "day")),
    [orders, today],
  );
  const todayItems = useMemo(() => {
    const acc = new Map<string, { key: string; name: string; unit: string; qty: number; orderNos: string[] }>();
    todayOrders.forEach((o) => o.items.forEach((it) => {
      if (it.item_status === "cancelled") return;
      const key = `${it.product_id}|${it.unit_abbr}`;
      const row = acc.get(key) ?? { key, name: it.product_name, unit: it.unit_abbr, qty: 0, orderNos: [] };
      row.qty += it.planned_qty;
      if (!row.orderNos.includes(o.production_no)) row.orderNos.push(o.production_no);
      acc.set(key, row);
    }));
    return [...acc.values()].sort((a, b) => thaiCompare(a.name, b.name));
  }, [todayOrders]);

  // ── แท็บ 2: สถานะการผลิต — ดูทีละวันตาม production_date (ค่าเริ่มต้น = วันนี้) ──
  // ใบของวันก่อนที่ยังไม่ปิดงาน (รอดำเนินการ/กำลังผลิต) ค้างอยู่ในคอลัมน์เดิมทุกวันถัดไปจนกว่าจะเสร็จหรือถูกยกเลิก
  // — กันใบที่ผลิตไม่เสร็จหายจากบอร์ดแล้วถูกลืม · ใบของวันหลังไม่โผล่ล่วงหน้า · เรียงวันผลิตเก่าสุดขึ้นก่อน
  const [statusDate, setStatusDate] = useState<Dayjs>(() => dayjs());
  const statusOrders = useMemo(
    () =>
      orders
        .filter((o) => {
          const d = dayjs(o.production_date);
          return d.isSame(statusDate, "day") || (!isFinalStatus(o.production_status) && d.isBefore(statusDate, "day"));
        })
        .sort((a, b) => dayjs(a.production_date).valueOf() - dayjs(b.production_date).valueOf()),
    [orders, statusDate],
  );

  // ── รายละเอียดใบสั่งผลิต (ใช้ร่วม: row บนแท็บ 1, การ์ดบนแท็บ 2, row บนแท็บ 3) ──
  // drawer ผูกกับ ?id= (แพทเทิร์นเดียวกับ Manage Orders) · หาจาก list ที่โหลดไว้ก่อน (ใหม่สุด 200 ใบ) ถ้าไม่เจอ
  // (ใบเก่ากว่านั้น) ค่อยดึงใบนั้นตรง ๆ ด้วย GET /admin/production-orders/{id} · จำ id ล่าสุดไว้แม้ปิดแล้ว
  // (เนื้อหาไม่หายวูบระหว่าง animation ปิด)
  const drawerOpen = !!urlOrderId;
  const [selectedId, setSelectedId] = useState<string | null>(urlOrderId);
  if (urlOrderId && urlOrderId !== selectedId) setSelectedId(urlOrderId);
  const selectedInList = orders.find((o) => o._id === selectedId) ?? null;
  // key อยู่ใต้ ["production-orders"] — mutation ที่ invalidate ทั้งก้อนอยู่แล้ว (เริ่ม/เสร็จ/ยกเลิก) อัปเดตใบนี้ด้วย
  const detailQ = useQuery({
    queryKey: ["production-orders", "detail", selectedId],
    queryFn: () => productionOrdersService.get(selectedId as string),
    enabled: drawerOpen && !!selectedId && ordersQ.isSuccess && !selectedInList,
  });
  const selectedOrder =
    selectedInList ?? (detailQ.data ? toProductionOrder(detailQ.data.data, productsById) : null);
  // ใบจากรอบพรีออเดอร์: จำนวนต่อรายการ = ผลรวมที่ลูกค้าสั่ง (ชำระแล้ว) ในรอบ — ดึงรอบมาเทียบกับโควตาที่เปิดรับต่อรอบ (max_qty_total)
  const selectedRoundId = selectedOrder?.source_type === "preorder" ? selectedOrder.round_id ?? null : null;
  const roundQ = useQuery({
    queryKey: ["preorder-rounds", "detail", selectedRoundId],
    queryFn: () => preorderRoundsService.get(selectedRoundId as string),
    enabled: drawerOpen && !!selectedRoundId,
  });
  const selectedRoundQuota = useMemo(
    () => (roundQ.data ? new Map((roundQ.data.data.items ?? []).map((it) => [it.product_id, it.max_qty_total])) : null),
    [roundQ.data],
  );
  const openDetail = (id: string) =>
    router.replace(`/owner/production?tab=${activeTab}&id=${encodeURIComponent(id)}`, { scroll: false });
  const closeDrawer = () => router.replace(`/owner/production?tab=${activeTab}`, { scroll: false });

  // ── แท็บ 3: ประวัติการผลิต — เลือกช่วงแบบเดียวกับหน้ารายงานยอดขาย (วัน/สัปดาห์/เดือน/ไตรมาส/ปี) ──
  const [historyViewMode, setHistoryViewMode] = useState<HistoryViewMode>("month");
  const [historyDate, setHistoryDate] = useState<Dayjs>(() => dayjs());

  // ตารางแสดงทุกใบตั้งแต่สร้าง (วางแผน/กำลังผลิต/เสร็จ/ยกเลิก) — ผู้ใช้ขอ 2026-10-29: สร้างใบแล้วเห็นในประวัติทันที
  // วันที่ที่ใช้กรองช่วง: ใบที่เสร็จแล้ว = เวลาเสร็จ · ใบอื่น = วันที่ผลิตตามแผน · ใหม่สุดก่อน
  const historyDateOf = (o: ProductionOrder) => (o.production_status === "done" && o.completed_at ? o.completed_at : o.production_date);
  const historyRows = useMemo(
    () => {
      const [start, end] = getRangeStartEnd(historyViewMode, historyDate);
      return orders
        .filter((o) => {
          const at = dayjs(historyDateOf(o));
          return at.isValid() && !at.isBefore(start) && !at.isAfter(end);
        })
        .sort((a, b) => dayjs(historyDateOf(b)).valueOf() - dayjs(historyDateOf(a)).valueOf());
    },
    [orders, historyViewMode, historyDate],
  );
  // สถิติ/breakdown นับเฉพาะใบที่ผลิตเสร็จแล้วในช่วงที่เลือก — ใบที่ยังไม่ผลิตไม่มีจำนวนผลิตจริง/เวลาที่ใช้
  const doneHistoryRows = useMemo(() => historyRows.filter((o) => o.production_status === "done"), [historyRows]);

  // จำนวนนับจากที่ผลิตได้จริง (producedQty) ไม่ใช่ที่วางแผน
  const historyStats = useMemo(() => {
    const totalQty = doneHistoryRows.reduce((s, o) => s + o.items.reduce((si, it) => si + producedQty(it), 0), 0);
    const durations = doneHistoryRows.map(durationHours).filter((d): d is number => d !== null);
    const avgDuration = durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
    return { allOrders: historyRows.length, totalOrders: doneHistoryRows.length, totalQty, avgDuration };
  }, [historyRows, doneHistoryRows]);

  const productBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    doneHistoryRows.forEach((o) => o.items.forEach((it) => {
      const qty = producedQty(it);
      if (qty > 0) acc[it.product_name] = (acc[it.product_name] ?? 0) + qty;
    }));
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [doneHistoryRows]);

  const teamBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    doneHistoryRows.forEach((o) => { if (o.assignee_name) acc[o.assignee_name] = (acc[o.assignee_name] ?? 0) + 1; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [doneHistoryRows]);

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
    onError: (e) => alert.error(isApiError(e) ? e.message : t("production.createFailed")),
  });

  const createFromRound = useMutation({
    mutationFn: (v: ProductionOrderFromRoundInput) => productionOrdersService.createFromRound(v),
    onSuccess: () => {
      alert.success(t("production.fromRoundCreated"));
      invalidate();
      qc.invalidateQueries({ queryKey: ["preorder-rounds"] });
      setCreateFromRoundOpen(false);
      setFromRoundId(null);
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

  // ปิดงานผลิต → เปิดหน้าต่างให้เลือกตัดวัตถุดิบตามจำนวนที่วางแผน / ที่ผลิตได้จริง ก่อนเรียก /complete
  const [completeTarget, setCompleteTarget] = useState<ProductionOrder | null>(null);
  const completeOrder = useMutation({
    mutationFn: async ({ order, v }: { order: ProductionOrder; v: CompleteProductionValue }) => {
      // ผลิตได้จริง: บันทึก actual_qty ทีละรายการก่อน (0 = ผลิตไม่ได้ → ยกเลิกรายการ ไม่ตัดวัตถุดิบ/ไม่เพิ่มสต็อก)
      for (const [itemId, qty] of Object.entries(v.actuals)) {
        await productionOrdersService.updateItem(itemId, qty > 0 ? { actual_qty: qty } : { actual_qty: 0, item_status: "cancelled" });
      }
      return productionOrdersService.complete(order._id, { use_actual: v.useActual, lots: v.lots });
    },
    onSettled: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-lots"] });
    },
  });

  const onCompleteSubmit = (v: CompleteProductionValue) => {
    const order = completeTarget;
    if (!order) return;
    completeOrder.mutate(
      { order, v },
      {
        onSuccess: () => {
          alert.success(t("production.statusChanged", { no: order.production_no, status: t("enums.productionStatus.done") }));
          setCompleteTarget(null);
        },
        onError: (e) => alert.error(isApiError(e) ? e.message : t("production.statusChangeFailed")),
      },
    );
  };

  const onChangeStatus = async (order: ProductionOrder, next: ProductionStatus) => {
    if (next === order.production_status) return;
    // ยกเลิกย้อนกลับไม่ได้ (คืนสต็อกวัตถุดิบที่หักไปแล้ว) — ถามก่อนทุกครั้ง ทั้งลากการ์ดไปคอลัมน์ "ยกเลิก" และกดปุ่ม
    // กันลากพลาด/กดพลาดแล้วใบที่ยังผลิตไม่เสร็จถูกยกเลิกไปเอง
    if (next === "cancelled") {
      const ok = await confirmAlert(t("production.cancelConfirm", { no: order.production_no }), {
        title: t("production.cancelOrder"),
        confirmText: t("production.cancelOrder"),
        cancelText: t("common.close"),
        danger: true,
      });
      if (!ok) return;
    }
    // ปิดงานผลิต (หักวัตถุดิบ + เพิ่มสต็อก) = production.approve ที่ backend — ไม่มีสิทธิ์ = บอกก่อน ไม่เปิดหน้าต่างให้กรอกแล้วได้ 403
    // (ลากการ์ดไปคอลัมน์ "เสร็จ" ก็ผ่านตรงนี้)
    if (next === "done" && !perm.approve) {
      alert.warning(t("production.completeNeedsApprove"));
      return;
    }
    if (next === "done") {
      setCompleteTarget(order);
      return;
    }
    changeStatus.mutate(
      { order, next },
      {
        onSuccess: () => alert.success(
          t("production.statusChanged", { no: order.production_no, status: t(`enums.productionStatus.${next}`) }),
        ),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("production.statusChangeFailed")),
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
    today, todayItems, todayOrderCount: todayOrders.length,
    createOpen, openCreate: () => setCreateOpen(true), closeCreate: () => setCreateOpen(false),
    onCreateSubmit, creating: createOrder.isPending,

    closedRounds, roundsWithProduction, isClosedRoundsLoading: closedRoundsQ.isLoading,
    fromRoundId, setFromRoundId,
    fromRoundPreview: fromRoundPreviewQ.data?.data ?? null,
    isFromRoundPreviewLoading: fromRoundPreviewQ.isFetching,
    isFromRoundPreviewError: fromRoundPreviewQ.isError, refetchFromRoundPreview: fromRoundPreviewQ.refetch,
    createFromRoundOpen,
    openCreateFromRound: () => { setFromRoundId(null); setCreateFromRoundOpen(true); },
    closeCreateFromRound: () => setCreateFromRoundOpen(false),
    onCreateFromRoundSubmit: (v: ProductionOrderFromRoundInput) => createFromRound.mutate(v),
    creatingFromRound: createFromRound.isPending,

    // แท็บ 2
    orders, statusDate, setStatusDate, statusOrders,

    // แท็บ 3
    historyViewMode, setHistoryViewMode,
    historyDate, setHistoryDate,
    historyRows, historyStats, productBreakdown, teamBreakdown,

    // รายละเอียด (ใช้ร่วม)
    selectedOrder, drawerOpen, selectedRoundQuota,
    onView: (o: ProductionOrder) => openDetail(o._id),
    closeDrawer,
    // id ใน URL ไม่มีใน list (ผิด/ถูกลบ/เก่ากว่า 200 ใบ) — drawer ต้องบอก ไม่ใช่ว่างเปล่า
    // ไม่อยู่ใน list และดึงรายตัวก็ไม่เจอ (id ผิด/ถูกลบ) — drawer ต้องบอก ไม่ใช่ว่างเปล่า
    isDetailNotFound: drawerOpen && !selectedOrder && detailQ.isError,
    isDetailLoading: drawerOpen && !selectedOrder && (ordersQ.isLoading || detailQ.isLoading),

    isFinalStatus, getNextStatus,
    onChangeStatus, onAdvanceStatus, onCancelOrder,
    completeTarget, closeComplete: () => setCompleteTarget(null), onCompleteSubmit, completing: completeOrder.isPending,
  };
}
