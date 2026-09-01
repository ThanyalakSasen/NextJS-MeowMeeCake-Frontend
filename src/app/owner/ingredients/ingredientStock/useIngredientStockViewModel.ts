"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Ingredient Stock — จัดการสต็อกวัตถุดิบ (รับเข้า / เบิกใช้ / ปรับยอด)
// แต่ละ action: POST /ingredient-transactions + PATCH /ingredients/:id (best-effort 2 คำขอ
// แบบเดียวกับ POS — backend จริงควรทำ atomic ใน endpoint เดียว)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ingredientsService } from "@/services/ingredients";
import { unitsService } from "@/services/units";
import { ingredientTransactionsService } from "@/services/ingredientTransactions";
import { usePermission } from "@/context/PermissionsContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { alert } from "@/lib/alert";
import type { StockStatus, IngredientTxnType } from "@/constants/enumConfig";
import { getIngredientStatus, stockPercent } from "../ingredientStatus";

export interface StockRow {
  _id: string;
  sku: string;
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

const skuOf = (id: string) => `ING-${id.slice(-6).toUpperCase()}`;

export function useIngredientStockViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("stock");
  const { user } = useCurrentUser();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | StockStatus>("all");
  const [target, setTarget] = useState<StockRow | null>(null);
  const [mode, setMode] = useState<ActionMode>("receive");

  const ingredientsQ = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => ingredientsService.list({ limit: 100 }),
  });
  const unitsQ = useQuery({
    queryKey: ["units"],
    queryFn: () => unitsService.list(),
  });

  const rows = useMemo<StockRow[]>(() => {
    const unitMap = new Map((unitsQ.data?.data ?? []).map((u) => [u._id, u.unit_abbr || u.unit_name]));
    return (ingredientsQ.data?.data ?? []).map((i) => ({
      _id: i._id,
      sku: skuOf(i._id),
      name: i.ingredient_name,
      unitAbbr: (i.unit_id && unitMap.get(i.unit_id)) || "",
      currentStock: i.current_stock,
      reorderPoint: i.reorder_point,
      maxStock: i.max_stock ?? null,
      costPerUnit: i.cost_per_unit,
      status: getIngredientStatus(i),
      pct: stockPercent(i),
    }));
  }, [ingredientsQ.data, unitsQ.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q);
      const matchStatus = status === "all" || r.status === status;
      return matchSearch && matchStatus;
    });
  }, [rows, search, status]);

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
      // receive: +value · use: -value · adjust: value = สต็อกใหม่ (absolute)
      const nextStock =
        m === "receive" ? row.currentStock + value : m === "use" ? row.currentStock - value : value;
      const delta = Math.abs(nextStock - row.currentStock);

      await ingredientsService.update(row._id, { current_stock: Math.max(0, nextStock) });
      await ingredientTransactionsService
        .create({
          ingredient_id: row._id,
          type: m,
          quantity: delta,
          note: note.trim() || undefined,
          performed_by: user?.fullname,
        })
        .catch(() => undefined);
    },
    onSuccess: (_r, vars) => {
      alert.success(t(`ingredientStock.done_${vars.m}`, { name: vars.row.name }));
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      qc.invalidateQueries({ queryKey: ["ingredient-transactions"] });
      setTarget(null);
    },
    onError: () => alert.error(t("ingredientStock.actionFailed")),
  });

  return {
    perm,
    rows: filtered,
    stats,
    isLoading: ingredientsQ.isLoading || unitsQ.isLoading,
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
