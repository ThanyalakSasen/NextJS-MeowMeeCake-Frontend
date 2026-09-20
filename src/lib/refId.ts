/**
 * refId — backend หลาย resource populate field ที่ลงท้าย `_id` (category_id, unit_id, role_id ฯลฯ)
 * ให้เป็น object เต็ม `{ _id, ... }` แทนที่จะเป็น string id ดิบ (ตอน GET/list) — แต่ตอน create/update
 * body ต้องส่งกลับไปเป็น string id ธรรมดา ใช้ตัวนี้ดึง id ออกมาให้ชัวร์ไม่ว่าจะเจอแบบไหน
 */
export function refId(ref: { _id: string } | string | null | undefined): string {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref._id;
}
