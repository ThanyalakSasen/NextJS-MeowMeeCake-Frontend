// MOCK (D17) — บันทึกการทำงานของพนักงาน (audit log)
// user_id อ้างถึง usersFixture · entity อ้างถึง i18n namespace "entities"
import type { UserLog } from "@/types/userLog";

export const userLogsFixture: UserLog[] = [
  {
    _id: "log_1", user_id: "u_owner", action: "แก้ไขราคาสินค้า มัทฉะเค้ก",
    action_type: "UPDATE", entity: "Products", entity_id: "p_matcha", ip_address: "192.168.1.10",
    changes: [
      { field: "product_price", before: "120", after: "135" },
      { field: "sale_price", before: "ไม่มีข้อมูล", after: "119" },
    ],
    created_at: "2026-09-02T02:15:00.000Z",
  },
  {
    _id: "log_2", user_id: "u_manager", action: "ยืนยันการชำระเงินออเดอร์ #ORD-1042",
    action_type: "UPDATE", entity: "Orders", entity_id: "o_1042", ip_address: "192.168.1.22",
    changes: [{ field: "payment_status", before: "รอชำระเงิน", after: "ชำระแล้ว" }],
    created_at: "2026-09-02T01:40:00.000Z",
  },
  {
    _id: "log_3", user_id: "u_baker1", action: "รับเข้าวัตถุดิบ แป้งเค้ก 5000 กรัม",
    action_type: "CREATE", entity: "IngredientTransactions", entity_id: "itx_501", ip_address: "192.168.1.31",
    created_at: "2026-09-02T00:55:00.000Z",
  },
  {
    _id: "log_4", user_id: "u_cashier1", action: "เปิดออเดอร์หน้าร้าน #ORD-1050",
    action_type: "CREATE", entity: "Orders", entity_id: "o_1050", ip_address: "192.168.1.44",
    created_at: "2026-09-01T11:20:00.000Z",
  },
  {
    _id: "log_5", user_id: "u_owner", action: "ลบสูตร ครีมสดวานิลลา (เลิกใช้)",
    action_type: "DELETE", entity: "Recipes", entity_id: "r_vanilla", ip_address: "192.168.1.10",
    changes: [{ field: "recipe_name", before: "ครีมสดวานิลลา", after: "ไม่มีข้อมูล" }],
    created_at: "2026-09-01T09:05:00.000Z",
  },
  {
    _id: "log_6", user_id: "u_manager", action: "เข้าดูรายงานสรุปกำไร-ขาดทุน",
    action_type: "READ", entity: "Expenses", entity_id: null, ip_address: "192.168.1.22",
    created_at: "2026-09-01T08:30:00.000Z",
  },
  {
    _id: "log_7", user_id: "u_owner", action: "แก้ไขสิทธิ์ตำแหน่ง แคชเชียร์",
    action_type: "UPDATE", entity: "Permissions", entity_id: "perm_cashier_orders", ip_address: "192.168.1.10",
    changes: [{ field: "can_approve", before: "ไม่ใช่", after: "ใช่" }],
    created_at: "2026-08-31T14:12:00.000Z",
  },
  {
    _id: "log_8", user_id: "u_baker3", action: "แก้ไขจำนวนสต็อกวัตถุดิบ น้ำตาลทราย",
    action_type: "UPDATE", entity: "Ingredients", entity_id: "ing_sugar", ip_address: "192.168.1.33",
    changes: [{ field: "current_stock", before: "2400", after: "2900" }],
    created_at: "2026-08-31T10:00:00.000Z",
  },
  {
    _id: "log_9", user_id: "u_manager", action: "เพิ่มพนักงานใหม่ ธนกร บุญรอด",
    action_type: "CREATE", entity: "Users", entity_id: "u_cashier2", ip_address: "192.168.1.22",
    created_at: "2026-08-30T16:45:00.000Z",
  },
  {
    _id: "log_10", user_id: "u_owner", action: "เพิ่มหน่วยนับใหม่ ถาด",
    action_type: "CREATE", entity: "Units", entity_id: "unit_tray", ip_address: "192.168.1.10",
    created_at: "2026-08-30T13:20:00.000Z",
  },
  {
    _id: "log_11", user_id: "u_cashier1", action: "เข้าสู่ระบบ",
    action_type: "OTHER", entity: null, entity_id: null, ip_address: "192.168.1.44",
    created_at: "2026-08-30T08:00:00.000Z",
  },
  {
    _id: "log_12", user_id: "u_baker1", action: "แก้ไขสูตร มัทฉะสปันจ์",
    action_type: "UPDATE", entity: "Recipes", entity_id: "r_matcha_sponge", ip_address: "192.168.1.31",
    changes: [
      { field: "duration_minutes", before: "45", after: "40" },
      { field: "estimated_cost_per_batch", before: "180", after: "195" },
    ],
    created_at: "2026-08-29T15:30:00.000Z",
  },
];
