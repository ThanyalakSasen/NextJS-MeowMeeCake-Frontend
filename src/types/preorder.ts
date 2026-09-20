// ─────────────────────────────────────────────────────────────
// src/types/preorder.ts — DTO ของ /admin/preorders* (preorderModel/preorderItemModel จริงฝั่ง backend)
//
// state machine ของ order_status (pending→confirmed→preparing→ready→completed, cancelled ได้ทุกจุดที่
// ยังไม่ completed) และ payment_status เหมือน Order ทุกประการ — reuse OrderStatus/PaymentStatus จาก
// enumConfig ตรง ๆ ไม่สร้างซ้ำ (ดู services/preorderService.ts NEXT_STATUS ฝั่ง backend)
//
// backend populate user_id/round_id เป็น object เต็มเสมอ (ทั้ง list และ get) — denormalize เป็น
// customer_name/customer_phone/round_name ที่ services/preorders.ts จุดเดียว (แพทเทิร์นเดียวกับ
// services/orders.ts toOrder())
//
// ไม่มี create/update ทั่วไปที่นี่ — แอดมินไม่สร้างพรีออเดอร์แทนลูกค้าในหน้านี้ (ขอบเขตที่ยืนยันแล้ว:
// จัดการ "รอบ" + ดู/เปลี่ยนสถานะออเดอร์ลูกค้าที่มีอยู่แล้วเท่านั้น) — ดู services/preorders.ts
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { OrderStatus, PaymentStatus, RoundStatus } from "@/constants/enumConfig";
import type { OrderType, DeliveryAddress } from "@/types/order";

export interface PreorderItem {
  _id: string;
  preorder_id: string;
  round_item_id: string;
  product_id: string;
  product_name: string;
  pickup_date: string;
  special_request?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Preorder {
  _id: string;
  preorder_no: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  round_id: string;
  round_name: string;
  round_pickup_date?: string;
  round_status?: RoundStatus;
  order_type: OrderType;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_address?: DeliveryAddress | null;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  cancelled_reason?: string | null;
  /** มีเฉพาะตอน preordersService.get(id) — list ไม่มี (อยู่คนละ collection) */
  items?: PreorderItem[];
  created_at: string;
  updated_at: string;
}

export interface PreorderListParams extends ListParams {
  user_id?: string;
  round_id?: string;
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
  order_type?: OrderType;
  date_from?: string;
  date_to?: string;
}
