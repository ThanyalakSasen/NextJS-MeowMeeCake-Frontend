// ─────────────────────────────────────────────────────────────
// ingredientStatus.ts — pure: สถานะสต็อกวัตถุดิบ (ต่างจากสินค้า — เกณฑ์คือ reorder_point ต่อรายการ)
// ─────────────────────────────────────────────────────────────
import type { StockStatus } from "@/constants/enumConfig";
import type { Ingredient } from "@/types/ingredient";

type StockLike = Pick<Ingredient, "current_stock" | "reorder_point" | "max_stock">;

export function getIngredientStatus(ing: StockLike): StockStatus {
  if (ing.current_stock <= 0) return "out";
  if (ing.current_stock < ing.reorder_point) return "low";
  return "ok";
}

/** % ของสต็อกปัจจุบันเทียบเพดานคลัง — max_stock ถ้ามี ไม่งั้นประมาณจาก reorder_point × 4 */
export function stockPercent(ing: StockLike): number {
  const max =
    ing.max_stock && ing.max_stock > 0
      ? ing.max_stock
      : Math.max(ing.reorder_point * 4, ing.current_stock, 1);
  return Math.max(0, Math.min(100, Math.round((ing.current_stock / max) * 100)));
}
