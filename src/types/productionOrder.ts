// ─────────────────────────────────────────────────────────────
// src/types/productionOrder.ts — DTO ของ resource /admin/production-orders (productionOrderModel.ts
// + productionItemModel.ts จริงฝั่ง backend — คนละ collection กัน backend รวม items[] ให้ตอน GET/list)
//
// แต่ละ production item ต้องผูก recipe_id จริง (backend บังคับ required — recipe.product_id ต้องตรง
// กับ product_id ของแถวนั้นด้วย) ไม่ใช่แค่ product_id เฉย ๆ ตามที่ DTO เดิมสมมติไว้
// backend populate: item.product_id → {_id, product_name_th, product_name_eng}, item.recipe_id →
// {_id, recipe_name, yield_qty}, order.assigned_to → {_id, user_fullname, email}, order.round_id →
// {_id, round_name, pickup_date, round_status} (เฉพาะ source_type "preorder" — ตอน GET/list)
// เปลี่ยนสถานะ (planned→in_progress→done, →cancelled) ผ่าน sub-route /start /complete /cancel เท่านั้น
// — PATCH ตรง ๆ แก้ได้แค่ production_date/assigned_to/production_note (backend เพิกเฉย field อื่น)
//
// สร้างได้ 2 ทาง: POST /admin/production-orders (สร้างเอง — source_type บังคับ "manual" เสมอ) หรือ
// POST /admin/production-orders/from-preorder-round (รวมยอดสั่งจริงจากรอบพรีออเดอร์ที่ "closed" แล้ว
// ให้อัตโนมัติ — source_type = "preorder", round_id ผูกไว้ — ดู services/productionOrderService.ts
// createProductionFromRound ฝั่ง backend)
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { ProductionStatus, SourceType } from "@/constants/enumConfig";

export type ProductionItemStatus = "pending" | "in_progress" | "done" | "cancelled";

type PopulatedRef<T> = T | string | null;

/** shape ดิบจาก backend (productionItemModel + populate product_id/recipe_id) */
export interface RawProductionOrderItem {
  _id: string;
  product_id: PopulatedRef<{ _id: string; product_name_th: string; product_name_eng?: string }>;
  recipe_id: PopulatedRef<{ _id: string; recipe_name: string; yield_qty: number }>;
  planned_qty: number;
  actual_qty?: number | null;
  item_status: ProductionItemStatus;
  notes?: string | null;
}

/** มีเฉพาะ source_type === "preorder" — backend populate round_id ตอน GET/list */
type PopulatedRound = { _id: string; round_name: string; pickup_date: string; round_status: string };

/** shape ดิบจาก backend (productionOrderModel + populate assigned_to/round_id + items[] ผนวกจาก listByOrder) */
export interface RawProductionOrder {
  _id: string;
  production_no: string;
  production_date: string;
  source_type: SourceType;
  round_id?: PopulatedRef<PopulatedRound>;
  production_status: ProductionStatus;
  assigned_to?: PopulatedRef<{ _id: string; user_fullname: string; email?: string }>;
  production_note?: string | null;
  items: RawProductionOrderItem[];
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** item ฝั่ง UI — denormalize product_name/unit_abbr ที่ ViewModel (join กับ productOptions ที่โหลดแยกอยู่แล้ว) */
export interface ProductionOrderItem {
  _id: string;
  product_id: string;
  recipe_id: string;
  product_name: string;
  unit_abbr: string;
  planned_qty: number;
  actual_qty?: number | null;
  item_status: ProductionItemStatus;
  notes?: string | null;
}

/** order ฝั่ง UI — denormalize assignee_name/round_name จาก assigned_to/round_id ที่ populate มาแล้ว */
export interface ProductionOrder {
  _id: string;
  production_no: string;
  production_date: string;
  source_type: SourceType;
  round_id?: string | null;
  round_name?: string | null;
  production_status: ProductionStatus;
  assigned_to?: string | null;
  assignee_name?: string | null;
  production_note?: string | null;
  items: ProductionOrderItem[];
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductionOrderItemInput {
  product_id: string;
  recipe_id: string;
  planned_qty: number;
  notes?: string | null;
}

/** body ตอน POST /admin/production-orders — สร้างเอง backend บังคับ source_type เป็น "manual" เสมอ
 *  (ส่งอะไรมาก็เพิกเฉย) — สร้างจากรอบพรีออเดอร์ใช้ ProductionOrderFromRoundInput แทน */
export interface ProductionOrderCreateInput {
  production_date: string;
  source_type?: SourceType;
  assigned_to?: string | null;
  production_note?: string | null;
  items?: CreateProductionOrderItemInput[];
}

/** body ตอน POST /admin/production-orders/from-preorder-round — round_id ต้องเป็นรอบที่ round_status
 *  = "closed" เท่านั้น (backend ปฏิเสธ 409 ถ้ายังไม่ปิดรับ หรือมีใบสั่งผลิตของรอบนี้อยู่แล้ว) */
export interface ProductionOrderFromRoundInput {
  round_id: string;
  production_date: string;
  assigned_to?: string | null;
  production_note?: string | null;
}

/** body ตอน PATCH /admin/production-orders/[id] — แก้ได้แค่ 3 field นี้ (ดูหมายเหตุด้านบน) */
export interface ProductionOrderUpdateInput {
  production_date?: string;
  assigned_to?: string | null;
  production_note?: string | null;
}

export interface ProductionOrderListParams extends ListParams {
  production_status?: ProductionStatus;
  source_type?: SourceType;
  round_id?: string;
  assigned_to?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}
