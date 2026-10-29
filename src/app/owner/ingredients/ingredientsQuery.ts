// ─────────────────────────────────────────────────────────────
// ingredientsQuery.ts — pure: query key/params ของหน้าวัตถุดิบทั้ง 4 หน้า (รายการ · สต็อก · ประวัติ · หน่วย)
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL, type HttpReader } from "@/lib/http";
import { ingredientTransactionsService } from "@/services/ingredientTransactions";
import type { IngredientTransaction } from "@/types/ingredientTransaction";

export const INGREDIENTS_PARAMS = { limit: LIST_ALL };
export const INGREDIENTS_KEY = ["ingredients"] as const;
export const INGREDIENT_CATEGORIES_KEY = ["ingredient-categories"] as const;
export const UNITS_KEY = ["units"] as const;
export const INGREDIENT_TXNS_PARAMS = { limit: LIST_ALL };
export const INGREDIENT_TXNS_KEY = ["ingredient-transactions"] as const;
/** ประวัติของวัตถุดิบตัวเดียว (กรองที่ backend) — ใช้ตอนเลือกวัตถุดิบแล้วรายการรวมโหลดไม่ครบ */
export const ingredientTxnsByIngredientKey = (id: string) => ["ingredient-transactions", "ingredient", id] as const;

export interface IngredientTxnsData {
  data: IngredientTransaction[];
  /** มีรายการเก่ากว่าที่โหลดไว้ (ไม่แสดงในตาราง) */
  olderHidden: boolean;
  /** ยอดจริงจาก backend (ไม่ขึ้นกับจำนวนที่โหลด) — การ์ดสถิติ */
  total: number;
  receive: number;
  use: number;
}

// ประวัติวัตถุดิบ = ล่าสุด LIST_ALL รายการ (backend เรียงวันที่ทำรายการใหม่ → เก่า) · ตัวเลขบนการ์ด = ยอดจริงจาก meta.total
// เดิมการ์ดหยุดที่ 1,000 และรายการเก่ากว่านั้นหายเงียบ ๆ
export async function fetchIngredientTxns(h?: HttpReader): Promise<IngredientTxnsData> {
  const count = (type: "receive" | "use") =>
    ingredientTransactionsService.list({ type, limit: 1 }, h).then((r) => r.meta.total);
  const [recent, receive, use] = await Promise.all([
    ingredientTransactionsService.list(INGREDIENT_TXNS_PARAMS, h),
    count("receive"),
    count("use"),
  ]);
  return { data: recent.data, olderHidden: recent.meta.total > recent.data.length, total: recent.meta.total, receive, use };
}
