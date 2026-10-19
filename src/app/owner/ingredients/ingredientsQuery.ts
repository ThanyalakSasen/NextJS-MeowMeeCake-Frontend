// ─────────────────────────────────────────────────────────────
// ingredientsQuery.ts — pure: query key/params ของหน้าวัตถุดิบทั้ง 4 หน้า (รายการ · สต็อก · ประวัติ · หน่วย)
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

export const INGREDIENTS_PARAMS = { limit: LIST_ALL };
export const INGREDIENTS_KEY = ["ingredients"] as const;
export const INGREDIENT_CATEGORIES_KEY = ["ingredient-categories"] as const;
export const UNITS_KEY = ["units"] as const;
export const INGREDIENT_TXNS_PARAMS = { limit: LIST_ALL };
export const INGREDIENT_TXNS_KEY = ["ingredient-transactions"] as const;
