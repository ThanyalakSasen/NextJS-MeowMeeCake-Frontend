"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Ingredient History — log การเคลื่อนไหวสต็อกวัตถุดิบ (อ่านอย่างเดียว)
// สร้าง transaction ทำที่หน้า Ingredient Stock (#10) — หน้านี้แค่ดูย้อนหลัง
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ingredientTransactionsService } from "@/services/ingredientTransactions";
import { ingredientsService } from "@/services/ingredients";
import { unitsService } from "@/services/units";
import { usePermission } from "@/context/PermissionsContext";
import type { IngredientTxnType } from "@/constants/enumConfig";

export interface HistoryRow {
  _id: string;
  createdAt: string;
  ingredientName: string;
  type: IngredientTxnType;
  quantity: number;
  unitAbbr: string;
  note: string;
  performedBy: string;
}

type TypeFilter = "all" | IngredientTxnType;

export function useIngredientHistoryViewModel() {
  const perm = usePermission("stock");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [ingredientId, setIngredientId] = useState<string>("all");

  const txnsQ = useQuery({
    queryKey: ["ingredient-transactions"],
    queryFn: () => ingredientTransactionsService.list({ limit: 100 }),
  });
  const ingredientsQ = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => ingredientsService.list({ limit: 100 }),
  });
  const unitsQ = useQuery({
    queryKey: ["units"],
    queryFn: () => unitsService.list(),
  });

  const ingredients = ingredientsQ.data?.data ?? [];

  const rows = useMemo<HistoryRow[]>(() => {
    const unitMap = new Map((unitsQ.data?.data ?? []).map((u) => [u._id, u.unit_abbr || u.unit_name]));
    const ingMap = new Map(
      (ingredientsQ.data?.data ?? []).map((i) => [
        i._id,
        { name: i.ingredient_name, unit: (i.unit_id && unitMap.get(i.unit_id)) || "" },
      ]),
    );
    return (txnsQ.data?.data ?? [])
      .map((tx) => {
        const ing = ingMap.get(tx.ingredient_id);
        return {
          _id: tx._id,
          createdAt: tx.created_at,
          ingredientName: ing?.name ?? "—",
          type: tx.type,
          quantity: tx.quantity,
          unitAbbr: ing?.unit ?? "",
          note: tx.note ?? "",
          performedBy: tx.performed_by ?? "—",
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [txnsQ.data, ingredientsQ.data, unitsQ.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ingName =
      ingredientId === "all"
        ? null
        : (ingredientsQ.data?.data ?? []).find((i) => i._id === ingredientId)?.ingredient_name ?? null;
    return rows.filter((r) => {
      const matchSearch =
        !q ||
        r.ingredientName.toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q) ||
        r.performedBy.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || r.type === typeFilter;
      const matchIng = ingName === null || r.ingredientName === ingName;
      return matchSearch && matchType && matchIng;
    });
  }, [rows, search, typeFilter, ingredientId, ingredientsQ.data]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      receive: rows.filter((r) => r.type === "receive").length,
      use: rows.filter((r) => r.type === "use").length,
    }),
    [rows],
  );

  return {
    perm,
    rows: filtered,
    stats,
    ingredients,
    isLoading: txnsQ.isLoading || ingredientsQ.isLoading || unitsQ.isLoading,
    isError: txnsQ.isError,
    refetch: () => txnsQ.refetch(),

    search, setSearch,
    typeFilter, setTypeFilter,
    ingredientId, setIngredientId,
  };
}
