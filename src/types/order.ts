// ─────────────────────────────────────────────────────────────
// src/types/order.ts — DTO ของ resource /admin/orders (orderModel.ts จริงฝั่ง backend)
//
// ⚠️ ไม่ครอบคลุมพรีออเดอร์ — backend เก็บพรีออเดอร์เป็นคนละ collection ทั้งหมด (preorderModel /
// preorderItemModel / preorderRoundModel, เสิร์ฟที่ /admin/preorders) ยังไม่ได้เชื่อมกับ frontend
// ตัวนี้ — ดู docs/BACKLOG (Preorders integration)
//
// customer_name/customer_phone denormalize มาจาก user_id ที่ backend populate ให้ (ทำที่
// services/orders.ts จุดเดียว) — items ไม่มาใน list (อยู่คนละ collection orderItemModel) ต้องเรียก
// ordersService.get(id) ถึงจะได้ items จริง
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";

// ตรงกับ backend จริง (orderModel.order_type) — ไม่ใช่ "ready"/"preorder" (นั่นคือ product_type)
export type OrderType = "delivery" | "takeaway";

export interface OrderLineItem {
  _id: string;
  product_id: string;
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_request?: string | null;
}

export interface DeliveryAddress {
  recipient_name: string;
  recipient_phone: string;
  house_no: string;
  sub_district: string;
  district: string;
  province: string;
  zip_code: string;
}

export interface Order {
  _id: string;
  order_no: string;
  order_type: OrderType;
  /** ref ดิบ (ใช้ตอน create) — GET/list ใช้ customer_name/customer_phone ที่ denormalize แล้วแทน */
  user_id: string;
  customer_name: string;
  customer_phone: string;
  /** มีเฉพาะตอน ordersService.get(id) — list ไม่มี (อยู่คนละ collection) */
  items?: OrderLineItem[];
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_address?: DeliveryAddress | null;
  created_at: string;
  updated_at: string;
}

/** body ตอน POST /admin/orders จริง — ต่างจาก Order มาก (backend gen order_no/subtotal/total_amount เอง) */
export interface OrderInput {
  user_id: string;
  source: "items";
  order_type: OrderType;
  delivery_address?: DeliveryAddress | null;
  items: { product_id: string; quantity: number }[];
  /** ส่วนลดกรอกมือ (ใช้เมื่อไม่ได้ระบุโปรโมชัน) */
  discount_amount?: number;
  channel?: "online" | "instore";
}

export interface OrderListParams extends ListParams {
  order_type?: OrderType;
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
}
