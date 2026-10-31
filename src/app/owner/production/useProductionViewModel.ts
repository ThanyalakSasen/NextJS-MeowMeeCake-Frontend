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
import { useToday } from "@/hooks/useToday";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { refId } from "@/lib/refId";
import { unitLabel } from "@/utils/unitContext";
import type { ProductionStatus } from "@/constants/enumConfig";
import type { CompleteProductionValue } from "./_components/CompleteProductionModal";
import { thaiCompare } from "@/lib/thaiSort";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import { PRODUCTION_ORDERS_KEY, PRODUCTION_PRODUCTS_KEY, fetchProductionOrders, productionHistoryKey, productionHistoryParams, PRODUCTION_PRODUCTS_PARAMS, PRODUCTION_UNITS_KEY, tabFrom, type TabKey } from "./productionQuery";
import type {
  ProductionOrder, RawProductionOrder, CreateProductionOrderItemInput, ProductionOrderFromRoundInput, ProductionOrderEditInput,
} from "@/types/productionOrder";
import {
  isFinalStatus, getNextStatus, durationHours, producedQty,
} from "./productionStatus";


/** โหมดดูประวัติการผลิต — ชุดเดียวกับหน้ารายงานยอดขาย (วัน/สัปดาห์/เดือน/ไตรมาส/ปี — utils/period) */
export type HistoryViewMode = PeriodType;

/** รายการในฟอร์มใบสั่งผลิต — item_id = รายการเดิมของใบ (โหมดแก้ไข) */
export type ProductionOrderFormItem = CreateProductionOrderItemInput & { item_id?: string };

export interface CreateProductionOrderValue {
  production_date: string;
  assigned_to: string | null;
  production_note: string | null;
  items: ProductionOrderFormItem[];
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
        from_round: !!it.round_item_id,
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
  const ordersQ = useQuery({ queryKey: PRODUCTION_ORDERS_KEY, queryFn: () => fetchProductionOrders() });
  const productsQ = useQuery({ queryKey: PRODUCTION_PRODUCTS_KEY, queryFn: () => productsService.list(PRODUCTION_PRODUCTS_PARAMS) });
  const unitsQ = useQuery({ queryKey: PRODUCTION_UNITS_KEY, queryFn: () => unitsService.list() });

  // ฟอร์มสร้างใบสั่งผลิต — ประกาศก่อน query ด้านล่างที่ใช้เป็นตัวเลือกในฟอร์มเท่านั้น
  const [createOpen, setCreateOpen] = useState(false);
  const [createFromRoundOpen, setCreateFromRoundOpen] = useState(false);
  // ใบที่กำลังแก้ (ฟอร์มเดียวกับตอนสร้าง)
  const [editTarget, setEditTarget] = useState<ProductionOrder | null>(null);
  const formOpen = createOpen || createFromRoundOpen || !!editTarget;
  // พนักงาน/role/สูตร/รอบที่ปิดแล้ว = ตัวเลือกในฟอร์มสร้างเท่านั้น — ดึงเมื่อเปิดฟอร์ม (เดิมดึงตอนเปิดหน้า 4 ก้อน
  // แต่ละก้อนมาถึงแล้วทั้งหน้าวาดใหม่อีกรอบระหว่างโหลด → TBT)
  // ทีมงานเท่านั้น (เจ้าของ+พนักงาน) — ชุดเดียวกับหน้าพนักงาน (แคชร่วม) · คนที่มีแค่สิทธิ์ผลิต backend ก็ให้เห็นแค่นี้
  const usersQ = useQuery({ queryKey: STAFF_KEY, queryFn: () => usersService.list(STAFF_PARAMS), enabled: formOpen });
  const rolesQ = useQuery({ queryKey: ["roles"], queryFn: () => rolesService.list(), enabled: formOpen });
  const recipesQ = useQuery({ queryKey: ["recipes"], queryFn: () => recipesService.list({ limit: LIST_ALL }), enabled: createOpen || !!editTarget });
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

  /** product_id → สูตรทั้งหมดของสินค้านั้น (backend บังคับทุก production item ต้องผูก recipe_id จริง)
   *  เดิมเก็บแค่สูตรแรกที่เจอ — สินค้าหลายสูตรได้สูตรแรกเงียบ ๆ ตัดวัตถุดิบผิดสูตร (ข้อ 15) · ตอนนี้ฟอร์มให้เลือกเมื่อมีมากกว่า 1 */
  const recipesByProduct = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }[]>();
    (recipesQ.data?.data ?? []).forEach((r) => {
      if (!r.product_id) return;
      map.set(r.product_id, [...(map.get(r.product_id) ?? []), { _id: r._id, name: r.recipe_name }]);
    });
    map.forEach((list) => list.sort((a, b) => thaiCompare(a.name, b.name)));
    return map;
  }, [recipesQ.data]);

  const orders: ProductionOrder[] = useMemo(
    () => (ordersQ.data?.data ?? []).map((o) => toProductionOrder(o, productsById)),
    [ordersQ.data, productsById],
  );

  /** ตัวเลือกสินค้าตอนสร้างใบสั่งผลิต — สินค้าทุกตัว (ปกติ + พรีออเดอร์) · ยังไม่มีสูตร = recipes ว่าง
   *  ฟอร์มแสดงแต่เลือกไม่ได้ (backend บังคับ recipe_id ต่อแถว — ใช้ตัดวัตถุดิบตอนผลิตเสร็จ) · เดิมซ่อนไปเลย ผู้ใช้ไม่รู้ว่าหายเพราะอะไร */
  const productOptions = useMemo(() => (
    (productsQ.data?.data ?? [])
      .map((p) => ({
        _id: p._id,
        name: productsById.get(p._id)?.name ?? p.product_name_th,
        unit_abbr: productsById.get(p._id)?.unit_abbr ?? "",
        recipes: recipesByProduct.get(p._id) ?? [],
      }))
      .sort((a, b) => thaiCompare(a.name, b.name))
  ), [productsQ.data, recipesByProduct, productsById]);

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

  // ── วันนี้ผลิตอะไรบ้าง (หัวส่วนแผนการผลิต) ──
  // เฉพาะใบที่ยังไม่จบ (รอดำเนินการ/กำลังผลิต) ที่วันผลิตเป็นวันนี้ หรือค้างมาจากวันก่อน — ปิดงานแล้ว = ออกจากการ์ดทันที
  // ไปอยู่ที่ประวัติการผลิต · ยกเลิก = ไม่แสดง · ใบของวันหลังไม่โผล่ล่วงหน้า (ผู้ใช้ขอ 2026-10-30)
  // รวมจำนวนต่อสินค้า (สินค้าเดียวกันหลายใบ = บวกกัน) เรียงตามชื่อ
  // เปลี่ยนเองเมื่อข้ามเที่ยงคืน (เปิดหน้าค้างข้ามคืน การ์ด/ป้าย "ค้างจาก…" ไม่ค้างวันเก่า)
  const today = useToday();
  const todayOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          (o.production_status === "planned" || o.production_status === "in_progress") &&
          !dayjs(o.production_date).isAfter(today, "day"),
      ),
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
  // ยังไม่ได้เลือกเอง (null) = ตามวันนี้ (useToday) — เปิดหน้าค้างข้ามวัน/เดือน ช่วงเริ่มต้นเลื่อนตาม ไม่ค้างช่วงตอนเปิดหน้า
  // เลือกวันเองแล้ว = คงค่าที่เลือก
  const [pickedHistoryDate, setHistoryDate] = useState<Dayjs | null>(null);
  const historyDate = pickedHistoryDate ?? today;

  // ตารางแสดงทุกใบตั้งแต่สร้าง (วางแผน/กำลังผลิต/เสร็จ/ยกเลิก) — ผู้ใช้ขอ 2026-10-29: สร้างใบแล้วเห็นในประวัติทันที
  // วันที่ที่ใช้กรองช่วง: ใบที่เสร็จแล้ว = เวลาเสร็จ · ใบอื่น = วันที่ผลิตตามแผน · ใหม่สุดก่อน
  const historyDateOf = (o: ProductionOrder) => (o.production_status === "done" && o.completed_at ? o.completed_at : o.production_date);
  // backend กรองช่วงให้ (history_from/to — กติกาวันที่เดียวกับ historyDateOf) · เดิมกรองจากรายการ 1,000 ใบล่าสุด ช่วงเก่าไม่ครบ
  const [historyStart, historyEnd] = useMemo(() => getRangeStartEnd(historyViewMode, historyDate), [historyViewMode, historyDate]);
  const historyFrom = historyStart.toISOString();
  const historyTo = historyEnd.toISOString();
  const historyQ = useQuery({
    queryKey: productionHistoryKey(historyFrom, historyTo),
    queryFn: () => productionOrdersService.list(productionHistoryParams(historyFrom, historyTo)),
    // ประวัติอยู่ใต้แผนการผลิตในหน้าเดียวกันแล้ว (ProductionView) — เดิมโหลดเฉพาะ ?tab=history → ค้าง "กำลังโหลด" ตลอด
  });
  const historyRows = useMemo(
    () =>
      (historyQ.data?.data ?? [])
        .map((o) => toProductionOrder(o, productsById))
        .sort((a, b) => dayjs(historyDateOf(b)).valueOf() - dayjs(historyDateOf(a)).valueOf()),
    [historyQ.data, productsById],
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
        items: v.items.map((it) => ({ product_id: it.product_id, recipe_id: it.recipe_id, planned_qty: it.planned_qty, notes: it.notes })),
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

  /** แก้ใบ: หัวใบ + ลบ/แก้/เพิ่มรายการ ส่งในคำขอเดียว (PUT /edit) — เดิมยิงทีละคำขอ พลาดกลางทาง = ใบเหลือครึ่ง ๆ กลาง ๆ (ข้อ 12)
   *  backend ตรวจทั้งหมดก่อนเขียน · ล้มเหลวก็ invalidate ให้ฟอร์ม/ตารางเห็นสถานะจริง */
  const editOrder = useMutation({
    mutationFn: ({ order, v, itemsEditable, canAddItems }: { order: ProductionOrder; v: CreateProductionOrderValue; itemsEditable: boolean; canAddItems: boolean }) => {
      const items: NonNullable<ProductionOrderEditInput["items"]> = { remove: [], update: [], add: [] };
      if (canAddItems) {
        if (itemsEditable) {
          const kept = new Map(v.items.filter((it) => it.item_id).map((it) => [it.item_id as string, it]));
          for (const old of order.items) {
            if (old.item_status === "cancelled") continue;
            const it = kept.get(old._id);
            if (!it) items.remove.push(old._id);
            else if (it.planned_qty !== old.planned_qty || (it.notes ?? null) !== (old.notes ?? null)) {
              items.update.push({ item_id: old._id, planned_qty: it.planned_qty, notes: it.notes ?? null });
            }
          }
        }
        for (const { item_id, ...it } of v.items) {
          if (!item_id) items.add.push({ product_id: it.product_id, recipe_id: it.recipe_id, planned_qty: it.planned_qty, notes: it.notes });
        }
      }
      return productionOrdersService.saveEdit(order._id, {
        production_date: v.production_date,
        assigned_to: v.assigned_to,
        production_note: v.production_note,
        ...(items.remove.length || items.update.length || items.add.length ? { items } : {}),
      });
    },
    onSuccess: () => {
      alert.success(t("production.updated"));
      invalidate();
      setEditTarget(null);
    },
    onError: (e) => {
      invalidate();
      alert.error(isApiError(e) ? e.message : t("production.updateFailed"));
    },
  });
  // แก้รายการเดิมได้เฉพาะใบสร้างเองที่ยังไม่เริ่มผลิต — ใบจากรอบพรีออเดอร์ยอดมาจากออเดอร์จริง / เริ่มผลิตแล้วอาจตัดวัตถุดิบไปแล้ว
  const editItemsEditable = !!editTarget && editTarget.production_status === "planned" && editTarget.source_type === "manual";
  // เพิ่มสินค้าใหม่ได้ทุกใบที่ยังไม่เริ่มผลิต — ใบจากรอบพรีออเดอร์ผลิตเพิ่มขายหน้าร้านได้ (รายการเดิมยังล็อก)
  const editCanAddItems = !!editTarget && editTarget.production_status === "planned";

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

  // ปิดงานผลิต → เปิดหน้าต่างวันผลิต/วันหมดอายุ ก่อนเรียก /complete (ตัดวัตถุดิบตามจำนวนที่วางแผนเสมอ)
  const [completeTarget, setCompleteTarget] = useState<ProductionOrder | null>(null);
  const completeOrder = useMutation({
    // ใบที่ยังไม่เริ่ม (planned) — backend ปิดงานได้จากสถานะกำลังผลิตเท่านั้น → เริ่มผลิตให้ก่อนตอนกดยืนยัน
    // (เปิดหน้าต่างแล้วกดยกเลิก = ใบยังเป็นรอดำเนินการเหมือนเดิม)
    // order ในหน้าต่างเป็นค่าตอนเปิด — ครั้งก่อนเริ่มผลิตสำเร็จแต่ปิดงานพลาด กดซ้ำจะเริ่มซ้ำแล้วได้ 409
    // ("in_progress → in_progress") → 409 ตอนเริ่ม = ข้ามไปปิดงานเลย (backend ตรวจสถานะจริงตอนปิดงานอีกที)
    mutationFn: async ({ order, v }: { order: ProductionOrder; v: CompleteProductionValue }) => {
      if (order.production_status === "planned") {
        try {
          await productionOrdersService.start(order._id);
        } catch (e) {
          if (!(isApiError(e) && e.status === 409)) throw e;
        }
      }
      return productionOrdersService.complete(order._id, { use_actual: false, lots: v.lots });
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

  const onCancelOrder = (order: ProductionOrder) => onChangeStatus(order, "cancelled");
  /** ปุ่ม "เริ่มการผลิต" (การ์ดวันนี้ผลิต + ป๊อปอัป) — ใบรอดำเนินการ → กำลังผลิต */
  const onStartOrder = (order: ProductionOrder) => onChangeStatus(order, "in_progress");
  const startingId = changeStatus.isPending && changeStatus.variables?.next === "in_progress" ? changeStatus.variables.order._id : null;
  /** ปุ่ม "ผลิตเรียบร้อย" ในป๊อปอัปรายละเอียด — ใบรอดำเนินการ/กำลังผลิต → หน้าต่างปิดงาน (ตัดวัตถุดิบ + เพิ่มสต็อก + ล็อต) */
  const onFinishOrder = (order: ProductionOrder) => onChangeStatus(order, "done");

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
    /** ใบที่ต้องผลิตวันนี้ + ที่ค้างจากวันก่อน (การ์ด "วันนี้ผลิตอะไรบ้าง") — ตัดรายการที่ยกเลิก · ค้างนานสุดขึ้นก่อน แล้วเรียงเลขใบ */
    todayOrders: todayOrders
      .map((o) => ({ ...o, items: o.items.filter((it) => it.item_status !== "cancelled") }))
      .filter((o) => o.items.length > 0)
      .sort(
        (a, b) =>
          dayjs(a.production_date).startOf("day").valueOf() - dayjs(b.production_date).startOf("day").valueOf() ||
          a.production_no.localeCompare(b.production_no),
      ),
    createOpen, openCreate: () => setCreateOpen(true), closeCreate: () => setCreateOpen(false),
    onCreateSubmit, creating: createOrder.isPending,

    editTarget, editItemsEditable, editCanAddItems,
    openEdit: (o: ProductionOrder) => setEditTarget(o),
    closeEdit: () => setEditTarget(null),
    onEditSubmit: (v: CreateProductionOrderValue) =>
      editTarget && editOrder.mutate({ order: editTarget, v, itemsEditable: editItemsEditable, canAddItems: editCanAddItems }),
    editing: editOrder.isPending,

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
    historyRows, historyLoading: historyQ.isPending, historyError: historyQ.isError, refetchHistory: () => void historyQ.refetch(),
    historyStats, productBreakdown, teamBreakdown,

    // รายละเอียด (ใช้ร่วม)
    selectedOrder, drawerOpen, selectedRoundQuota,
    onView: (o: ProductionOrder) => openDetail(o._id),
    closeDrawer,
    // id ใน URL ไม่มีใน list (ผิด/ถูกลบ/เก่ากว่า 200 ใบ) — drawer ต้องบอก ไม่ใช่ว่างเปล่า
    // ไม่อยู่ใน list และดึงรายตัวก็ไม่เจอ (id ผิด/ถูกลบ) — drawer ต้องบอก ไม่ใช่ว่างเปล่า
    isDetailNotFound: drawerOpen && !selectedOrder && detailQ.isError,
    isDetailLoading: drawerOpen && !selectedOrder && (ordersQ.isLoading || detailQ.isLoading),

    isFinalStatus, getNextStatus,
    onChangeStatus, onCancelOrder, onFinishOrder, onStartOrder, startingId,
    completeTarget, closeComplete: () => setCompleteTarget(null), onCompleteSubmit, completing: completeOrder.isPending,
  };
}
