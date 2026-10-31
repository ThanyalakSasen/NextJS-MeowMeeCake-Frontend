// ─────────────────────────────────────────────────────────────
// src/types/deleteBlocker.ts — เหตุที่ลบสินค้า/วัตถุดิบ/สูตร/ส่วนประกอบยังไม่ได้ (backend services/deleteBlockers.ts)
//   GET /admin/{products|ingredients|recipes|components}/:id/delete-blockers → DeleteBlocker[] (ว่าง = ลบได้)
// ─────────────────────────────────────────────────────────────
export type DeleteBlockerEntity = "product" | "ingredient" | "recipe" | "component";

export type BlockerKind = "stock" | "round" | "preorders" | "production" | "recipe" | "component" | "product" | "parent_recipe";

export type BlockerAction =
  | "remove_from_round"
  | "close_round_item"
  | "release_preorders"
  | "unlink_recipe"
  | "unlink_component"
  | "unlink_product"
  | "unlink_parent_recipe";

export interface DeleteBlocker {
  kind: BlockerKind;
  /** id ของสิ่งที่ action ไปแก้ (round item / recipe / component / product / ใบสั่งผลิต) */
  ref_id: string | null;
  /** ชื่อรอบ / เลขใบสั่งผลิต / ชื่อสูตร / ชื่อสินค้า */
  label: string;
  qty: number | null;
  unit: string | null;
  /** null = แก้ในหน้านี้ไม่ได้ (เช่น ปรับสต็อก · รอผลิตเสร็จ) */
  action: BlockerAction | null;
}
