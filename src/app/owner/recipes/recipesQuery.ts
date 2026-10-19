// ─────────────────────────────────────────────────────────────
// recipesQuery.ts — pure: query key/params ของหน้าสูตร (7 ก้อนที่ประกอบสิ่งที่เห็นบนหน้า)
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// key ตรงกับหน้าอื่นที่ใช้ข้อมูลชุดเดียวกัน (products/units/ingredients) — แคชใช้ร่วมกันได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

const ALL = { limit: LIST_ALL };

export const RECIPES_QUERIES = {
  recipes: { key: ["recipes"] as const, params: ALL },
  components: { key: ["components"] as const, params: ALL },
  componentCategories: { key: ["component-categories"] as const },
  products: { key: ["products"] as const, params: ALL },
  productCategories: { key: ["product-categories"] as const },
  units: { key: ["units"] as const },
  ingredients: { key: ["ingredients"] as const, params: ALL },
};
