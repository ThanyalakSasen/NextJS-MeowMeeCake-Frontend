"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Product Stock History — ประวัติสต็อกสินค้า (อ่านอย่างเดียว)
// backend บันทึกเองทุกทางที่สต็อกเปลี่ยน (หน้าสต็อก · ปิดงานผลิต · ขาย · ยกเลิกออเดอร์) — หน้านี้แค่ดูย้อนหลัง
// แบ่งหน้าที่ backend (ขายทุกออเดอร์เป็นประวัติ — โหลดทั้งหมดไม่ไหว) · ตัวกรองสินค้า/ประเภท/ช่วงวันที่ส่งไป backend
// ตัวเลือกสินค้า = รายการหน้าสต็อก (GET /admin/products/stock-list — stock หรือ stock_history .view)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Dayjs } from "dayjs";
import { productsService } from "@/services/products";
import { usePermission } from "@/context/PermissionsContext";
import { unitLabel } from "@/utils/unitContext";
import { sortOptionsThai } from "@/lib/thaiSort";
import type { ProductStockTransaction } from "@/types/productStockTransaction";
import { STOCK_LIST_KEY, STOCK_PARAMS } from "../productStock/stockQuery";
import { HISTORY_PAGE_SIZE, historyKey, historyParams, type HistoryFilters } from "./historyQuery";

export interface ProductHistoryRow {
  _id: string;
  createdAt: string;
  productName: string;
  type: ProductStockTransaction["type"];
  delta: number;
  qtyBefore: number;
  qtyAfter: number;
  unit: string;
  note: string;
  refType: ProductStockTransaction["ref_type"];
  refNo: string | null;
  by: PerformedBy;
}

/**
 * ผู้ทำรายการ — customer = ลูกค้าเจ้าของออเดอร์ทำเอง (สั่งซื้อ · ยกเลิกเอง) · staff = พนักงาน/เจ้าของร้าน
 * system = ระบบทำเอง (เช่น ยกเลิกอัตโนมัติเมื่อเลยกำหนดชำระ) — name = ลูกค้าของออเดอร์ (ถ้ามี)
 */
export type PerformedBy =
  | { kind: "customer"; name: string }
  | { kind: "staff"; name: string }
  | { kind: "system"; name: string | null };

function performedBy(tx: ProductStockTransaction): PerformedBy {
  const customer = tx.ref_customer;
  const actor = tx.performed_by;
  if (actor) {
    return customer && actor._id === customer._id
      ? { kind: "customer", name: customer.user_fullname }
      : { kind: "staff", name: actor.user_fullname };
  }
  // ตัดสต็อกตอนสร้างออเดอร์ไม่บันทึกผู้ทำ — ออเดอร์เป็นของลูกค้าคนนั้น
  if (customer && tx.type === "sale") return { kind: "customer", name: customer.user_fullname };
  return { kind: "system", name: customer?.user_fullname ?? null };
}

type DateRange = [Dayjs, Dayjs] | null;

function toRow(tx: ProductStockTransaction): ProductHistoryRow {
  return {
    _id: tx._id,
    createdAt: tx.created_at,
    productName: tx.product_id?.product_name_th ?? "—",
    type: tx.type,
    delta: tx.delta,
    qtyBefore: tx.qty_before,
    qtyAfter: tx.qty_after,
    unit: unitLabel(tx.product_id?.unit_id),
    note: tx.note ?? "",
    refType: tx.ref_type,
    refNo: tx.ref_no,
    by: performedBy(tx),
  };
}

/** initialProductId — ลิงก์ "ดูประวัติ" จากหน้าสต็อกสินค้า (?product=) */
export function useProductHistoryViewModel(initialProductId = "all") {
  const perm = usePermission("stock_history");

  const [productId, setProductIdState] = useState(initialProductId);
  const [type, setTypeState] = useState<HistoryFilters["type"]>("all");
  const [dateRange, setDateRangeState] = useState<DateRange>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(HISTORY_PAGE_SIZE);

  // เปลี่ยนตัวกรอง = กลับหน้า 1
  const setProductId = (v: string) => { setProductIdState(v); setPage(1); };
  const setType = (v: HistoryFilters["type"]) => { setTypeState(v); setPage(1); };
  const setDateRange = (v: DateRange) => { setDateRangeState(v); setPage(1); };

  const filters: HistoryFilters = {
    productId,
    type,
    dateFrom: dateRange ? dateRange[0].format("YYYY-MM-DD") : null,
    dateTo: dateRange ? dateRange[1].format("YYYY-MM-DD") : null,
  };
  const params = historyParams(filters, page, pageSize);
  const historyQ = useQuery({
    queryKey: historyKey(params),
    queryFn: () => productsService.stockHistory(params),
    placeholderData: keepPreviousData,
  });

  const productsQ = useQuery({
    queryKey: STOCK_LIST_KEY,
    queryFn: () => productsService.stockList(STOCK_PARAMS),
  });
  const productOptions = useMemo(
    () =>
      sortOptionsThai(
        (productsQ.data?.data ?? []).filter((p) => !p.is_preorder).map((p) => ({ value: p._id, label: p.product_name_th })),
      ),
    [productsQ.data],
  );

  const rows = useMemo(() => (historyQ.data?.data ?? []).map(toRow), [historyQ.data]);

  return {
    perm,
    rows,
    total: historyQ.data?.meta.total ?? 0,
    pagination: {
      page,
      pageSize,
      total: historyQ.data?.meta.total ?? 0,
      onChange: (p: number, size: number) => {
        setPage(size !== pageSize ? 1 : p);
        setPageSize(size);
      },
    },
    productOptions,
    // isPending (ไม่ใช่ isLoading) — หน้านี้ render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
    isLoading: historyQ.isPending,
    isError: historyQ.isError,
    refetch: () => historyQ.refetch(),

    productId, setProductId,
    type, setType,
    dateRange, setDateRange,
  };
}
