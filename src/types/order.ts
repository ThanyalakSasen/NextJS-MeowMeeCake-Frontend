// ─────────────────────────────────────────────────────────────
// src/types/order.ts
// DTO ของ resource /orders (docs/API_CONTRACT.md §3)
//
// ระบบต้นทาง (-MeowMeeCake-NextJS5) แยก Orders/Preorders/OrderItems/PreorderItems/
// Payments/PreorderRounds เป็นหลาย collection แล้ว join ฝั่ง client ตอนโหลดหน้า Manage Orders
// (ดู reference: owner/orders/manageOrders/page.tsx) — ที่นี่รวมเป็น DTO เดียว (`order_type`
// แยก ready/preorder ในตัว) ให้ตรงกับแพทเทิร์นของ resource อื่นในโปรเจกต์นี้ (เช่น Product ที่
// รวม product_type ready/preorder อยู่แล้ว) เพื่อให้ mock/consume ง่าย — ถ้า backend จริงยังแยก
// collection ให้ประกอบเป็น DTO นี้ที่ services/orders.ts จุดเดียว
// ─────────────────────────────────────────────────────────────
import type { ListParams } from "@/types/api";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";

export type OrderType = "ready" | "preorder";

export interface OrderLineItem {
  product_name: string;
  quantity: number;
}

export interface Order {
  _id: string;
  order_no: string;
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  items: OrderLineItem[];
  total_amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  /** base64/URL สลิปที่ลูกค้าแนบ — null/undefined = ยังไม่แนบ */
  payment_slip_url?: string | null;
  /** เวลาที่เจ้าของร้าน/พนักงานตรวจสลิปแล้ว — null/undefined = ยังไม่ได้ตรวจ */
  payment_verified_at?: string | null;
  /** หน้าร้าน = วันที่นัดส่งมอบ · พรีออเดอร์ = วันนัดรับของรอบพรีออเดอร์ */
  due_date: string;
  /** เฉพาะพรีออเดอร์ — จำนวนวันจากวันสั่งถึงวันนัดรับ (backend คำนวณ) */
  lead_time_days?: number;
  created_at: string;
  updated_at: string;
}

export type OrderInput = Omit<Order, "_id" | "created_at" | "updated_at">;

export interface OrderListParams extends ListParams {
  order_type?: OrderType;
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
}
