// ─────────────────────────────────────────────────────────────
// src/types/userLog.ts — DTO ของ /user-logs (audit log)
// อ่านอย่างเดียวฝั่ง frontend — backend เขียน log เองตอนมี CRUD เกิดขึ้น
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { UserLogAction } from "@/constants/enumConfig";

/**
 * entity ที่ audit log อ้างถึง — ตรงกับ string ที่ backend ส่งจริงใน audit() ทุกจุด
 * (src/lib/audit.ts + route handler แต่ละไฟล์) — เอกพจน์ PascalCase เสมอ, ตรงกับ
 * key ใน i18n namespace "entities"
 */
export type UserLogEntity =
  | "Product" | "ProductImage" | "ProductVariant" | "ProductOption" | "ProductCategory"
  | "Order" | "OrderItem" | "Preorder" | "PreorderItem" | "PreorderRound" | "PreorderRoundItem"
  | "Payment" | "Ingredient" | "IngredientCategory" | "IngredientTransaction"
  | "Recipe" | "Component" | "ComponentCategory"
  | "ProductionOrder" | "ProductionItem"
  | "User" | "Role" | "Permission" | "Promotion" | "PromotionUsage" | "Bundle"
  | "Banner" | "Expense" | "Unit" | "Aspect" | "SemanticTerm";

/**
 * shape ดิบจาก backend (userLogService.listLogs/getLogById) — `user_id` ถูก
 * `.populate("user_id", "user_fullname email")` เป็น object เต็ม ไม่ใช่ string id ดิบ
 * ไม่มี field `changes` (before/after แบบ diff รายฟิลด์) อยู่จริงเลย — backend เขียนแค่
 * `details` (Mixed, รูปแบบไม่คงที่ต่างกันไปทุก route: บางที่เป็น array ชื่อ field ที่แก้,
 * บางที่เป็น object เก็บบาง field ของ body) ส่วน `before`/`after` มีอยู่ใน schema
 * (userLogModel.ts) แต่ไม่มี route ไหนส่งค่ามาจริงเลยสักจุด — ห้ามคาดหวังว่ามันจะมีข้อมูล
 */
export interface RawUserLog {
  _id: string;
  user_id: string | { _id: string; user_fullname: string; email: string };
  action: string;
  action_type: UserLogAction;
  entity: UserLogEntity | null;
  entity_id: string | null;
  ip_address: string | null;
  details?: unknown;
  created_at: string;
}

export interface UserLog {
  _id: string;
  user_id: string;
  action: string;
  action_type: UserLogAction;
  entity: UserLogEntity | null;
  entity_id: string | null;
  ip_address: string | null;
  /** รายละเอียดเพิ่มเติมจาก backend — รูปแบบไม่คงที่ (ดูคอมเมนต์ RawUserLog ด้านบน) */
  details?: unknown;
  created_at: string;
}

export interface UserLogListParams extends ListParams {
  user_id?: string;
  action_type?: UserLogAction;
}
