"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Ingredient History — log การเคลื่อนไหวสต็อกวัตถุดิบ (อ่านอย่างเดียว)
// สร้าง transaction ทำที่หน้า Ingredient Stock (#10) — หน้านี้แค่ดูย้อนหลัง
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { INGREDIENTS_KEY, INGREDIENTS_PARAMS, INGREDIENT_TXNS_KEY, INGREDIENT_TXNS_PARAMS, fetchIngredientTxns, ingredientTxnsByIngredientKey } from "../ingredientsQuery";
import { ingredientTransactionsService } from "@/services/ingredientTransactions";
import { ingredientsService } from "@/services/ingredients";
import { usePermission } from "@/context/PermissionsContext";
import type { IngredientTxnType } from "@/constants/enumConfig";
import { refId } from "@/lib/refId";
import { unitLabel } from "@/utils/unitContext";

export interface HistoryRow {
  _id: string;
  createdAt: string;
  /** ใช้กรองตามวัตถุดิบ — กรองด้วยชื่อแล้ววัตถุดิบชื่อซ้ำกันประวัติปนกัน */
  ingredientId: string;
  ingredientName: string;
  type: IngredientTxnType;
  quantity: number;
  unitAbbr: string;
  note: string;
  /** วันหมดอายุของล็อตที่รับเข้า (null = ไม่ได้ระบุ) */
  expiryDate: string | null;
  performedBy: string;
  /** บิลซื้อ (ค่าใช้จ่าย) ที่รายการรับเข้านี้มาจาก — null = ไม่ได้ผูก */
  purchase: { description: string; date: string; vendor: string; lineTotal: number | null } | null;
}

type TypeFilter = "all" | IngredientTxnType;

export function useIngredientHistoryViewModel() {
  // ingredients ไม่ใช่ stock — API ของหน้านี้ตรวจ ingredients.* (Final-Backlog P2)
  const perm = usePermission("ingredient_history");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [ingredientId, setIngredientId] = useState<string>("all");

  const txnsQ = useQuery({
    queryKey: INGREDIENT_TXNS_KEY,
    queryFn: () => fetchIngredientTxns(),
  });
  const olderHidden = txnsQ.data?.olderHidden ?? false;
  // เลือกวัตถุดิบตัวเดียว + รายการรวมโหลดไม่ครบ → ดึงประวัติของตัวนั้นจาก backend (ครบกว่า ไม่ตกหล่นรายการเก่า)
  const byIngredientQ = useQuery({
    queryKey: ingredientTxnsByIngredientKey(ingredientId),
    queryFn: () => ingredientTransactionsService.list({ ...INGREDIENT_TXNS_PARAMS, ingredient_id: ingredientId }),
    enabled: olderHidden && ingredientId !== "all",
  });
  const txns = (olderHidden && ingredientId !== "all" ? byIngredientQ.data?.data : undefined) ?? txnsQ.data?.data;
  const ingredientsQ = useQuery({
    queryKey: INGREDIENTS_KEY,
    queryFn: () => ingredientsService.list(INGREDIENTS_PARAMS),
  });

  const ingredients = ingredientsQ.data?.data ?? [];

  const rows = useMemo<HistoryRow[]>(() => {
    const ingMap = new Map(
      (ingredientsQ.data?.data ?? []).map((i) => [
        i._id,
        { name: i.ingredient_name, unit: unitLabel(i.unit_id) },
      ]),
    );
    return (txns ?? [])
      .map((tx) => {
        const ingredientId = refId(tx.ingredient_id);
        const ing = ingMap.get(ingredientId);
        const performedByName =
          typeof tx.performed_by === "object" && tx.performed_by ? tx.performed_by.user_fullname : null;
        return {
          _id: tx._id,
          // วันที่ทำรายการจริง (บันทึกย้อนหลังได้) — ข้อมูลเก่าไม่มีใช้เวลาที่บันทึก
          createdAt: tx.transaction_date ?? tx.created_at,
          expiryDate: tx.expiry_date ?? null,
          ingredientId,
          ingredientName: ing?.name ?? "—",
          type: tx.type,
          quantity: tx.qty,
          unitAbbr: ing?.unit ?? "",
          note: tx.note ?? "",
          performedBy: performedByName ?? "—",
          purchase:
            tx.expense_id && typeof tx.expense_id === "object"
              ? { description: tx.expense_id.description, date: tx.expense_id.date, vendor: tx.expense_id.vendor ?? "", lineTotal: tx.line_total ?? null }
              : null,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [txns, ingredientsQ.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch =
        !q ||
        r.ingredientName.toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q) ||
        r.performedBy.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || r.type === typeFilter;
      const matchIng = ingredientId === "all" || r.ingredientId === ingredientId;
      return matchSearch && matchType && matchIng;
    });
  }, [rows, search, typeFilter, ingredientId]);

  // ยอดจริงจาก backend — รายการที่โหลดอาจไม่ครบประวัติ (ดู fetchIngredientTxns)
  const stats = useMemo(
    () => ({ total: txnsQ.data?.total ?? 0, receive: txnsQ.data?.receive ?? 0, use: txnsQ.data?.use ?? 0 }),
    [txnsQ.data],
  );

  return {
    perm,
    rows: filtered,
    stats,
    /** รายการรวมแสดงเฉพาะล่าสุด — เลือกวัตถุดิบเพื่อดูประวัติครบของตัวนั้น */
    olderHidden,
    ingredients,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: txnsQ.isPending || ingredientsQ.isPending,
    isError: txnsQ.isError,
    refetch: () => txnsQ.refetch(),

    search, setSearch,
    typeFilter, setTypeFilter,
    ingredientId, setIngredientId,
  };
}
