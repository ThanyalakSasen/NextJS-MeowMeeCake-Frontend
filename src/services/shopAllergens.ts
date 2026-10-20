// ─────────────────────────────────────────────────────────────
// src/services/shopAllergens.ts — คำเตือนแพ้อาหารของสินค้าทุกชิ้น (/shop/allergen-warnings · ต้องล็อกอิน)
// backend เทียบ user_allergies ของลูกค้ากับสูตรสินค้า (allergenChecker เดียวกับระบบแนะนำ)
// ส่งมาเฉพาะสินค้าที่ต้องเตือน · ไม่ได้บันทึกอาหารที่แพ้ = {}
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { AllergenWarning } from "@/services/catalog";

export const shopAllergensService = {
  /** GET /shop/allergen-warnings → { [product _id]: AllergenWarning } */
  warnings: async (): Promise<Record<string, AllergenWarning>> =>
    (await http.get<ItemResponse<{ warnings: Record<string, AllergenWarning> }>>("/shop/allergen-warnings")).data.warnings ?? {},
};
