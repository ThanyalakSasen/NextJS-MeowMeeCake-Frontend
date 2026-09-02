// ─────────────────────────────────────────────────────────────
// src/types/userLog.ts — DTO ของ /user-logs (audit log)
// อ่านอย่างเดียวฝั่ง frontend — backend เขียน log เองตอนมี CRUD เกิดขึ้น
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { UserLogAction } from "@/constants/enumConfig";

/** entity ที่ audit log อ้างถึง — ตรงกับ key ใน i18n namespace "entities" */
export type UserLogEntity =
  | "Products" | "Orders" | "Ingredients" | "IngredientTransactions"
  | "Recipes" | "Users" | "Roles" | "Permissions" | "Units" | "Expenses";

/** 1 field ที่เปลี่ยนใน UPDATE — ค่าถูก format เป็น string มาแล้วจาก backend */
export interface UserLogChange {
  field: string;
  before: string;
  after: string;
}

export interface UserLog {
  _id: string;
  user_id: string;
  action: string;
  action_type: UserLogAction;
  entity: UserLogEntity | null;
  entity_id: string | null;
  ip_address: string | null;
  changes?: UserLogChange[];
  created_at: string;
}

export interface UserLogListParams extends ListParams {
  user_id?: string;
  action_type?: UserLogAction;
}
