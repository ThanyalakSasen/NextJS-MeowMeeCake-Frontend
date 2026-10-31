// ─────────────────────────────────────────────────────────────
// src/services/deleteBlockers.ts — modal "ลบยังไม่ได้" (components/shared/feedback/DeleteBlockersModal)
//   list = เหตุที่ยังลบไม่ได้ · ปุ่มแก้ทีละข้อ · remove = ลบจริงหลังแก้ครบ
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { DeleteBlocker, DeleteBlockerEntity } from "@/types/deleteBlocker";

const BASE: Record<DeleteBlockerEntity, string> = {
  product: "/admin/products",
  ingredient: "/admin/ingredients",
  recipe: "/admin/recipes",
  component: "/admin/components",
};

export const deleteBlockersService = {
  list: (entity: DeleteBlockerEntity, id: string) =>
    http.get<ItemResponse<DeleteBlocker[]>>(`${BASE[entity]}/${id}/delete-blockers`).then((r) => r.data),
  remove: (entity: DeleteBlockerEntity, id: string) => http.delete<EmptyResponse>(`${BASE[entity]}/${id}`),
  /** สินค้า: ยังไม่มีคนจอง = เอาออกจากรอบ · จองแล้ว = ปิดการขายในรอบ (ออเดอร์เดิมยังผลิตต่อ) */
  releaseRound: (productId: string, roundItemId: string) =>
    http.post(`/admin/products/${productId}/release-round`, { round_item_id: roundItemId }),
  /** วัตถุดิบ: เอาออกจากสูตร/ส่วนประกอบ */
  unlinkIngredient: (ingredientId: string, kind: "recipe" | "component", refId: string) =>
    http.post(`/admin/ingredients/${ingredientId}/unlink`, { kind, ref_id: refId }),
  /** ส่วนประกอบ: ยกเลิกการผูกกับสูตรหลัก */
  unlinkComponent: (componentId: string, recipeId: string) =>
    http.post(`/admin/components/${componentId}/unlink`, { recipe_id: recipeId }),
  /** สูตร: ยกเลิกการผูกสินค้าแล้วลบสูตร (สูตรสุดท้ายของสินค้า) */
  unlinkProductAndDelete: (recipeId: string) => http.post(`/admin/recipes/${recipeId}/unlink-product`),
};
