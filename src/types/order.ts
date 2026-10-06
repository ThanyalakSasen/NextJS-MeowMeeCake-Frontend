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
import type { DeliveryStatus, OrderStatus, PaymentStatus } from "@/constants/enumConfig";

// ตรงกับ backend จริง (orderModel.order_type) — ไม่ใช่ "ready"/"preorder" (นั่นคือ product_type)
export type OrderType = "delivery" | "takeaway";

export interface OrderLineItem {
  _id: string;
  product_id: string;
  product_name: string;
  /** ข้อความรวมของตัวเลือกที่เลือก เช่น "ขนาด: 2 ปอนด์ · รสชาติ: วานิลลา" (product_snapshot.variant_name) */
  variant_name?: string | null;
  /** ออปชันเสริมที่เลือก (ข้อความบนเค้ก ฯลฯ) — backend §8.3 */
  selected_options?: { option_name: string; extra_price: number; text_value: string | null }[];
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

/** ข้อมูลจัดส่ง — มีความหมายเฉพาะ order_type = "delivery" (ฟิลด์ชุดเดียวกันทั้ง orderModel และ preorderModel) */
export interface DeliveryInfo {
  delivery_status: DeliveryStatus;
  tracking_no: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  delivered_note: string | null;
}

/** body ของ PATCH /admin/orders/{id}/delivery และ /admin/preorders/{id}/delivery (schemas/order.ts updateDeliveryBody)
 *  backend ตั้ง shipped_at ให้เองตอนเปลี่ยนเป็น shipping ครั้งแรก · delivered_at ตอนเปลี่ยนเป็น delivered
 *  · แจ้งลูกค้าเฉพาะตอน delivery_status เปลี่ยนจริง · ตอบ 400 ถ้าไม่ใช่ออเดอร์จัดส่ง */
export interface DeliveryUpdateInput {
  delivery_status?: DeliveryStatus;
  tracking_no?: string | null;
  delivered_note?: string | null;
}

/** ดึง DeliveryInfo จาก raw ของ backend — ใช้ร่วมกันใน services/orders.ts + services/preorders.ts */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toDeliveryInfo = (raw: any): DeliveryInfo => ({
  delivery_status: raw.delivery_status ?? "pending",
  tracking_no: raw.tracking_no ?? null,
  shipped_at: raw.shipped_at ?? null,
  delivered_at: raw.delivered_at ?? null,
  delivered_note: raw.delivered_note ?? null,
});

export interface Order extends DeliveryInfo {
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
  /** ออเดอร์เว็บ: หมดเขตชำระ (สั่ง + 30 นาที) · POS/แอดมินสร้าง/ออเดอร์เก่า = null (backend §8.8) */
  payment_due_at: string | null;
  /** เช่น "หมดเวลาชำระเงิน (ระบบยกเลิกอัตโนมัติ)" · ลูกค้ายกเลิกเอง · แอดมินยกเลิก */
  cancelled_reason: string | null;
  cancelled_at: string | null;
  /** takeaway ของเว็บ: จุดรับ (หน้าร้านประจำสัปดาห์) + วันรับ YYYY-MM-DD (backend §8.7) */
  pickup_point: PickupPoint | null;
  pickup_date: string | null;
  /** แต้มที่ใช้ + ส่วนลดจากแต้ม (บาท) · คูปองส่วนตัว + ส่วนลดจากคูปอง (backend §8.11) */
  points_redeemed: number;
  points_discount: number;
  user_coupon_id: string | null;
  coupon_discount: number;
  created_at: string;
  updated_at: string;
}

/** snapshot จุดรับสินค้า ณ ตอนสั่ง (orderModel.pickupPointSnapshotSchema) */
export interface PickupPoint {
  point_id: string | null;
  point_name: string;
  address?: string | null;
  note?: string | null;
}

/**
 * ยกเลิกแล้วแต่เงินยังอยู่ที่ร้าน = รอร้านโอนคืนเอง (ลูกค้ายกเลิกออเดอร์ที่ชำระแล้ว — backend ไม่คืนอัตโนมัติ §8.8)
 * ร้านโอนคืนแล้วกด paymentsService.refund() → payment_status "refunded"
 */
export const isAwaitingRefund = (o: Pick<Order, "order_status" | "payment_status">) =>
  o.order_status === "cancelled" && o.payment_status === "paid";

/** body ตอน POST /admin/orders จริง — ต่างจาก Order มาก (backend gen order_no/subtotal/total_amount เอง) */
export interface OrderInput {
  user_id: string;
  source: "items";
  order_type: OrderType;
  delivery_address?: DeliveryAddress | null;
  /** variant_ids = ตัวเลือกที่เลือกทุกกลุ่ม · selected_options = ออปชันเสริม (backend ตรวจ + คิดราคาเอง — §8.3) */
  items: {
    product_id: string;
    quantity: number;
    variant_ids?: string[];
    selected_options?: { option_id: string; text_value?: string }[];
  }[];
  /** ส่วนลดกรอกมือ (ใช้เมื่อไม่ได้ระบุโปรโมชัน) */
  discount_amount?: number;
  /** ใช้โปรโมชัน — backend คิดส่วนลดเอง (ไม่สนใจ discount_amount) · ส่ง promotion_code หรือ promotion_id อย่างใดอย่างหนึ่ง */
  promotion_id?: string;
  channel?: "online" | "instore";
}

export interface OrderListParams extends ListParams {
  order_type?: OrderType;
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
}
