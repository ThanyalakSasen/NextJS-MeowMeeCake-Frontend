"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Product Stock — สต็อกสินค้าปกติ (is_preorder: false)
// รายการจาก GET /admin/products/stock-list (stock.view — Final-Backlog P12) · ชื่อหมวด/หน่วยมากับรายการ (populate)
// รับเข้า/เบิกใช้ = PATCH /admin/products/:id/stock { delta } · ปรับยอด = PUT { quantity } (stock.update ทั้งคู่)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import type { StockStatus } from "@/constants/enumConfig";
import { getStockStatus } from "./stockStatus";
import { refId } from "@/lib/refId";
import { unitLabel } from "@/utils/unitContext";
import { isApiError } from "@/types/api";
import { STOCK_LIST_KEY, STOCK_PARAMS } from "./stockQuery";
import type { BulkStockItem, BulkStockLine, BulkStockMode } from "@/components/shared/stock";
import { sortByThai } from "@/lib/thaiSort";

export interface StockProductRow {
  _id: string;
  name: string;
  categoryId: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  status: StockStatus;
  value: number;
}

export type StatusFilter = "all" | StockStatus;

/** ปุ่มต่อแถว แบบหน้าสต็อกวัตถุดิบ — รับเข้า (+) · เบิกใช้ (−) · ปรับยอด (ตั้งยอดใหม่) */
export type StockActionMode = "receive" | "use" | "adjust";


export function useProductStockViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("stock");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [target, setTarget] = useState<StockProductRow | null>(null);
  const [mode, setMode] = useState<StockActionMode>("adjust");

  const productsQ = useQuery({
    queryKey: STOCK_LIST_KEY,
    queryFn: () => productsService.stockList(STOCK_PARAMS),
  });

  // ตัวกรองหมวด = หมวดที่มีสินค้าในหน้านี้ (จาก category_id ที่ populate มา) — ไม่เรียก /admin/product-categories (products.view)
  const categories = useMemo(() => {
    const byId = new Map<string, { _id: string; product_category_name: string }>();
    for (const p of productsQ.data?.data ?? []) {
      const c = p.category_id;
      if (c && typeof c === "object") byId.set(c._id, { _id: c._id, product_category_name: c.product_category_name });
    }
    return sortByThai([...byId.values()], (c) => c.product_category_name);
  }, [productsQ.data]);

  const rows = useMemo<StockProductRow[]>(() => {
    return (productsQ.data?.data ?? [])
      .filter((p) => !p.is_preorder) // กันซ้ำเผื่อ backend รุ่นเก่าที่ยังไม่รู้จัก ?is_preorder=
      .map((p) => {
        const stock = p.product_stock_quantity ?? 0;
        const categoryId = refId(p.category_id);
        return {
          _id: p._id,
          name: p.product_name_th,
          categoryId,
          category: typeof p.category_id === "object" && p.category_id ? p.category_id.product_category_name : "",
          unit: unitLabel(p.unit_id) || t("productStock.unitDefault"),
          price: p.product_price,
          stock,
          status: getStockStatus(stock),
          value: stock * p.product_price,
        };
      });
  }, [productsQ.data, t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.name.toLowerCase().includes(q);
      const matchCategory = categoryId === "all" || r.categoryId === categoryId;
      const matchStatus = status === "all" || r.status === status;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [rows, search, categoryId, status]);

  // ใกล้หมด / หมดสต็อก — แสดงเป็นตารางแยกด้านบน (ไม่ขึ้นกับคำค้น/ตัวกรอง เพื่อไม่ให้หลุดสายตา) · หมดก่อน แล้วเหลือน้อยสุดก่อน
  const alertRows = useMemo(
    () =>
      rows
        .filter((r) => r.status === "out" || r.status === "low")
        .sort((a, b) => (a.status === b.status ? 0 : a.status === "out" ? -1 : 1) || a.stock - b.stock),
    [rows],
  );

  const stats = useMemo(
    () => ({
      tracked: rows.length,
      low: rows.filter((r) => r.status === "low").length,
      out: rows.filter((r) => r.status === "out").length,
      totalValue: rows.reduce((s, r) => s + r.value, 0),
    }),
    [rows],
  );

  // ผ่าน endpoint สต็อกโดยเฉพาะ (BACKLOG2 §15.2 ข้อ 5) — แจ้งเตือนสินค้าใกล้หมด · เช็คสิทธิ์ stock · บันทึก log ก่อน → หลัง
  // รับเข้า/เบิกใช้ใช้ส่วนต่างแบบ atomic (ไม่ทับยอดที่ขายไประหว่างเปิด modal) · เบิกเกินที่มี backend ปฏิเสธ
  const submit = useMutation({
    mutationFn: ({ row, m, value, note }: { row: StockProductRow; m: StockActionMode; value: number; note?: string }) => {
      if (m === "receive") return productsService.adjustStock(row._id, value, note);
      if (m === "use") return productsService.adjustStock(row._id, -value, note);
      return productsService.setStock(row._id, value, note);
    },
    onSuccess: (_r, vars) => {
      alert.success(t(`productStock.done_${vars.m}`, { name: vars.row.name }));
      qc.invalidateQueries({ queryKey: ["products"] });
      setTarget(null);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("productStock.actionFailed")),
  });

  // ── ทำหลายรายการพร้อมกัน — ส่งทีละรายการ (backend ไม่มี bulk) · คืน error ของรายการที่ไม่สำเร็จให้ modal ──
  const [bulkOpen, setBulkOpen] = useState(false);
  // สแกนบาร์โค้ดบนฉลากดูล็อต (วันผลิต/หมดอายุ/รอบผลิต) — ดูได้ทุกคนที่เข้าหน้านี้
  const [lotLookupOpen, setLotLookupOpen] = useState(false);
  const bulkItems = useMemo<BulkStockItem[]>(
    () => rows.map((r) => ({ id: r._id, name: r.name, unit: r.unit, stock: r.stock })),
    [rows],
  );
  const onBulkSubmit = async (m: BulkStockMode, lines: BulkStockLine[]) => {
    const failed: Record<string, string> = {};
    for (const l of lines) {
      try {
        if (m === "receive") await productsService.adjustStock(l.id, l.value, l.note);
        else if (m === "use") await productsService.adjustStock(l.id, -l.value, l.note);
        else await productsService.setStock(l.id, l.value, l.note);
      } catch (e) {
        failed[l.id] = isApiError(e) ? e.message : t("productStock.actionFailed");
      }
    }
    const done = lines.length - Object.keys(failed).length;
    if (done > 0) {
      alert.success(t("bulkStock.done", { n: done }));
      qc.invalidateQueries({ queryKey: ["products"] });
    }
    if (done < lines.length) alert.error(t("bulkStock.someFailed", { n: lines.length - done }));
    return failed;
  };

  return {
    perm,
    bulkOpen, openBulk: () => setBulkOpen(true), closeBulk: () => setBulkOpen(false), bulkItems, onBulkSubmit,
    lotLookupOpen, openLotLookup: () => setLotLookupOpen(true), closeLotLookup: () => setLotLookupOpen(false),
    rows: filtered,
    alertRows,
    stats,
    categories,
    // isPending (ไม่ใช่ isLoading) — หน้านี้ render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
    isLoading: productsQ.isPending,
    isError: productsQ.isError,
    refetch: () => productsQ.refetch(),

    search, setSearch,
    categoryId, setCategoryId,
    status, setStatus,

    target,
    mode,
    openAction: (r: StockProductRow, m: StockActionMode) => { setTarget(r); setMode(m); },
    closeAction: () => setTarget(null),
    onSubmit: (value: number, note: string) => {
      if (target) submit.mutate({ row: target, m: mode, value, note: note.trim() || undefined });
    },
    saving: submit.isPending,
  };
}
