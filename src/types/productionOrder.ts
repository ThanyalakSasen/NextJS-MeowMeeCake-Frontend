// ─────────────────────────────────────────────────────────────
// src/types/productionOrder.ts
// DTO ของ resource /production-orders (Production — เฟส 4 หน้า #13–15)
//
// ระบบต้นทาง (-MeowMeeCake-NextJS5) แยก ProductionOrders/ProductionItems เป็น 2 collection
// join กับ Product/Recipe/User/PreorderRound หลายตัวฝั่ง client (ดู reference:
// owner/production/useProductionData.ts) — ที่นี่รวมเป็น DTO เดียว (`items[]` ฝังในตัว, denormalize
// ชื่อสินค้า/หน่วย/ผู้รับผิดชอบไว้ตรง ๆ) ตามแพทเทิร์นเดียวกับ `types/order.ts`
//
// **ตัดออกจากต้นทาง (ยังไม่มี resource `recipes` ในโปรเจกต์นี้ — รอ Screen #16):**
// ไม่ผูก recipe_id/ต้นทุนต่อสูตร, ไม่เช็ควัตถุดิบขาด/พอ, ไม่มี preorder round จริง
// (source_type = แค่ tag หมวดหมู่ ไม่ผูกกับ order record จริง) — ผูกจริงตอนสร้าง Screen #16
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { ProductionStatus, SourceType } from "@/constants/enumConfig";

export interface ProductionOrderItem {
  product_id: string;
  /** denormalize ไว้ตรง ๆ — โชว์ในตาราง/การ์ดโดยไม่ต้อง join */
  product_name: string;
  planned_qty: number;
  unit_abbr: string;
  notes?: string | null;
}

export interface ProductionOrder {
  _id: string;
  /** เช่น "PO-260902-1234" — gen ที่ ViewModel ตอนสร้าง */
  production_no: string;
  /** ISO date — วันที่ผลิต */
  production_date: string;
  source_type: SourceType;
  production_status: ProductionStatus;
  assigned_to?: string | null;
  /** denormalize ชื่อผู้รับผิดชอบ */
  assignee_name?: string | null;
  production_note?: string | null;
  items: ProductionOrderItem[];
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductionOrderInput = Omit<ProductionOrder, "_id" | "created_at" | "updated_at">;

export interface ProductionOrderListParams extends ListParams {
  production_status?: ProductionStatus;
}
