// ─────────────────────────────────────────────────────────────
// src/types/preorderRoundDashboard.ts — DTO ของสรุปรอบพรีออเดอร์ + รายชื่อลูกค้าในรอบ (BACKLOG4 F4 · backend Q-BE5)
//   GET /admin/preorder-rounds/dashboard · GET /admin/preorder-rounds/:id/customers
//   ดูโค้ดจริง backend services/preorderRoundDashboardService.ts
// ─────────────────────────────────────────────────────────────
import type { OrderStatus, PaymentStatus, RoundStatus } from "@/constants/enumConfig";
import type { DeliveryAddress, OrderType } from "@/types/order";

/** paid = ชำระแล้ว (ยังไม่ยกเลิก) · pending = ยังไม่ชำระ (ยังไม่ยกเลิก) · cancelled = ยกเลิกแล้ว */
export type PaymentGroup = "paid" | "pending" | "cancelled";
export const PAYMENT_GROUPS: PaymentGroup[] = ["paid", "pending", "cancelled"];

export interface RoundProductTally {
  round_item_id: string;
  product_id: string;
  product_name_th: string;
  product_name_eng: string;
  /** ยอดจองปัจจุบัน (ไม่นับที่ยกเลิก) */
  ordered_qty: number;
  quota: number;
  is_active: boolean;
}

export interface RoundDashboardRow {
  _id: string;
  round_name: string;
  open_date: string;
  close_date: string;
  pickup_date: string;
  round_status: RoundStatus;
  product_count: number;
  total_quota: number;
  total_ordered_qty: number;
  /** 0–100 */
  fill_rate: number;
  total_orders: number;
  /** ลูกค้าที่มีพรีออเดอร์ที่ยังไม่ยกเลิก */
  customer_count: number;
  /** บาท — ไม่รวมยกเลิก */
  total_revenue: number;
  payment: Record<PaymentGroup, { count: number; amount: number }>;
  products: RoundProductTally[];
}

export interface RoundDashboardParams {
  page?: number;
  limit?: number;
  status?: RoundStatus;
  search?: string;
}

export interface RoundCustomerLine {
  product_name_th: string;
  variant_name: string | null;
  selected_variants: { group_name: string; variant_name: string }[];
  selected_options: { option_name: string; text_value: string | null }[];
  special_request: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface RoundCustomerOrder {
  _id: string;
  preorder_no: string;
  order_type: OrderType;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_group: PaymentGroup;
  delivery_address: DeliveryAddress | null;
  pickup_date: string | null;
  pickup_point: { point_name: string; address: string } | null;
  total_amount: number;
  cancelled_reason: string | null;
  created_at: string;
  items: RoundCustomerLine[];
}

export interface RoundCustomer {
  user_id: string;
  user_fullname: string;
  email: string;
  user_phone: string | null;
  order_count: number;
  /** บาท — ไม่รวมยกเลิก */
  total_spent: number;
  orders: RoundCustomerOrder[];
}

export interface RoundCustomers {
  round: { _id: string; round_name: string; pickup_date: string; round_status: RoundStatus };
  customers: RoundCustomer[];
  total_customers: number;
  total_orders: number;
}

export interface RoundCustomersParams {
  /** ชื่อ · เบอร์ · อีเมล · เลขพรีออเดอร์ */
  search?: string;
  payment?: PaymentGroup;
  order_type?: OrderType;
}
