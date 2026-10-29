"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Ingredient Stock — จัดการสต็อกวัตถุดิบ (รับเข้า / เบิกใช้ / ปรับยอด)
// แต่ละ action: POST /ingredient-transactions + PATCH /ingredients/:id (best-effort 2 คำขอ
// แบบเดียวกับ POS — backend จริงควรทำ atomic ใน endpoint เดียว)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { INGREDIENTS_KEY, INGREDIENTS_PARAMS } from "../ingredientsQuery";
import { useTranslations } from "next-intl";
import { ingredientsService } from "@/services/ingredients";
import { ingredientTransactionsService } from "@/services/ingredientTransactions";
import { usePermission } from "@/context/PermissionsContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { alert } from "@/lib/alert";
import type { StockStatus, IngredientTxnType } from "@/constants/enumConfig";
import { getIngredientStatus, stockPercent } from "../ingredientStatus";
import { unitLabel } from "@/utils/unitContext";
import { isApiError } from "@/types/api";
import type { BulkStockItem, BulkStockLine, BulkStockMode } from "@/components/shared/stock";

export interface StockRow {
  _id: string;
  name: string;
  unitAbbr: string;
  currentStock: number;
  reorderPoint: number;
  maxStock: number | null;
  costPerUnit: number;
  status: StockStatus;
  pct: number;
}

export type ActionMode = IngredientTxnType; // "receive" | "use" | "adjust"


export function useIngredientStockViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  // ingredients ไม่ใช่ stock — API ของหน้านี้ตรวจ ingredients.* (Final-Backlog P2)
  const perm = usePermission("ingredient_stock");
  const { user } = useCurrentUser();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | StockStatus>("all");
  const [target, setTarget] = useState<StockRow | null>(null);
  const [mode, setMode] = useState<ActionMode>("receive");

  const ingredientsQ = useQuery({
    queryKey: INGREDIENTS_KEY,
    queryFn: () => ingredientsService.list(INGREDIENTS_PARAMS),
  });

  const rows = useMemo<StockRow[]>(() => {
    return (ingredientsQ.data?.data ?? []).map((i) => ({
      _id: i._id,
      name: i.ingredient_name,
      unitAbbr: unitLabel(i.unit_id),
      currentStock: i.current_stock,
      reorderPoint: i.reorder_point,
      maxStock: i.max_stock ?? null,
      costPerUnit: i.cost_per_unit,
      status: getIngredientStatus(i),
      pct: stockPercent(i),
    }));
  }, [ingredientsQ.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.name.toLowerCase().includes(q);
      const matchStatus = status === "all" || r.status === status;
      return matchSearch && matchStatus;
    });
  }, [rows, search, status]);

  // ใกล้หมด / หมดสต็อก — แสดงเป็นตารางแยกด้านบน (ไม่ขึ้นกับคำค้น/ตัวกรอง เพื่อไม่ให้หลุดสายตา) · หมดก่อน แล้วเหลือน้อยสุดก่อน
  const alertRows = useMemo(
    () =>
      rows
        .filter((r) => r.status === "out" || r.status === "low")
        .sort((a, b) => (a.status === b.status ? 0 : a.status === "out" ? -1 : 1) || a.currentStock - b.currentStock),
    [rows],
  );

  const stats = useMemo(
    () => ({
      tracked: rows.length,
      low: rows.filter((r) => r.status === "low").length,
      out: rows.filter((r) => r.status === "out").length,
      totalValue: rows.reduce((s, r) => s + r.currentStock * r.costPerUnit, 0),
    }),
    [rows],
  );

  const submit = useMutation({
    mutationFn: async ({ row, m, value, note }: { row: StockRow; m: ActionMode; value: number; note: string }) => {
      // current_stock ห้ามแก้ตรง ๆ (backend บล็อกไว้ที่ ingredientService — PATCH /ingredients ไม่รับ
      // field นี้เลย) ต้องผ่าน ingredientTransactionService.createTransaction() เท่านั้น ซึ่งจะปรับ
      // current_stock ให้อัตโนมัติ: receive = +qty · use = -qty · adjust = ตั้งยอดใหม่ตรง ๆ (= qty)
      // ตรงกับความหมายของ value ที่กรอกในฟอร์มนี้อยู่แล้ว ไม่ต้องคำนวณ delta เอง
      await ingredientTransactionsService.create({
        ingredient_id: row._id,
        type: m,
        qty: value,
        note: note.trim() || undefined,
        performed_by: user?.id ?? "",
      });
    },
    onSuccess: (_r, vars) => {
      alert.success(t(`ingredientStock.done_${vars.m}`, { name: vars.row.name }));
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      qc.invalidateQueries({ queryKey: ["ingredient-transactions"] });
      setTarget(null);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("ingredientStock.actionFailed")),
  });

  // ── ทำหลายรายการพร้อมกัน — ส่งทีละรายการ (backend ไม่มี bulk) · คืน error ของรายการที่ไม่สำเร็จให้ modal ──
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkItems = useMemo<BulkStockItem[]>(
    () => rows.map((r) => ({ id: r._id, name: r.name, unit: r.unitAbbr, stock: r.currentStock })),
    [rows],
  );
  const onBulkSubmit = async (m: BulkStockMode, lines: BulkStockLine[]) => {
    const failed: Record<string, string> = {};
    for (const l of lines) {
      try {
        await ingredientTransactionsService.create({
          ingredient_id: l.id,
          type: m,
          qty: l.value,
          note: l.note,
          transaction_date: l.date,
          expiry_date: l.expiry ?? null,
          performed_by: user?.id ?? "",
        });
      } catch (e) {
        failed[l.id] = isApiError(e) ? e.message : t("ingredientStock.actionFailed");
      }
    }
    const done = lines.length - Object.keys(failed).length;
    if (done > 0) {
      alert.success(t("bulkStock.done", { n: done }));
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      qc.invalidateQueries({ queryKey: ["ingredient-transactions"] });
    }
    if (done < lines.length) alert.error(t("bulkStock.someFailed", { n: lines.length - done }));
    return failed;
  };

  return {
    perm,
    bulkOpen, openBulk: () => setBulkOpen(true), closeBulk: () => setBulkOpen(false), bulkItems, onBulkSubmit,
    rows: filtered,
    alertRows,
    stats,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: ingredientsQ.isPending,
    isError: ingredientsQ.isError,
    refetch: () => ingredientsQ.refetch(),

    search, setSearch,
    status, setStatus,

    target,
    mode,
    openAction: (row: StockRow, m: ActionMode) => { setTarget(row); setMode(m); },
    closeAction: () => setTarget(null),
    onSubmit: (value: number, note: string) => {
      if (!target) return;
      submit.mutate({ row: target, m: mode, value, note });
    },
    submitting: submit.isPending,
  };
}
