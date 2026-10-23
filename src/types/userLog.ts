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
 * `before`/`after` = { ฟิลด์: ค่า } เฉพาะฟิลด์ที่เปลี่ยน (backend lib/auditDiff.ts · ค่า normalize แล้ว:
 * ref เป็นชื่อ · วันที่เป็น ISO) — แก้ไข = มีทั้งคู่ · สร้าง = after อย่างเดียว · ลบ = before อย่างเดียว
 * มีเฉพาะ log ใหม่ของ route ที่ใช้ auditChange (crud factory · สินค้า · โปรโมชัน · สต็อกสินค้า/วัตถุดิบ)
 * log เก่าและ route อื่นยังมีแค่ `details` (Mixed, รูปแบบไม่คงที่ต่อ route)
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
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  /** ฟิลด์ระบุตัวตนของเอกสารที่ไม่มีชื่อ (backend userLogPresenter) เช่น { role_id: "ผู้จัดการ", menu_key: "pos" } */
  context?: Record<string, unknown> | null;
  created_at: string;
}

export interface UserLog {
  _id: string;
  user_id: string;
  /** ชื่อผู้ทำรายการ (backend populate มาให้แล้ว) — ไม่ต้องดึงผู้ใช้ทั้งระบบมา join */
  user_name: string | null;
  action: string;
  action_type: UserLogAction;
  entity: UserLogEntity | null;
  entity_id: string | null;
  ip_address: string | null;
  /** รายละเอียดเพิ่มเติมจาก backend — รูปแบบไม่คงที่ (ดูคอมเมนต์ RawUserLog ด้านบน) */
  details?: unknown;
  /** ค่าเดิม/ค่าใหม่ของฟิลด์ที่เปลี่ยน (ดูคอมเมนต์ RawUserLog) */
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
  created_at: string;
}

export interface UserLogListParams extends ListParams {
  user_id?: string;
  action_type?: UserLogAction;
  /** ISO — created_at ตั้งแต่ / ถึง (backend: ?date_from= ?date_to=) */
  date_from?: string;
  date_to?: string;
}
