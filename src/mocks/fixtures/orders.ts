// ─────────────────────────────────────────────────────────────
// src/mocks/fixtures/orders.ts  — MOCK (D17)
// ผสมสถานะ/การชำระเงินให้ครบเคส — โครงตรงกับ /admin/orders จริง (orderModel.ts ฝั่ง backend)
// พรีออเดอร์ไม่รวมที่นี่ — คนละ collection ทั้งหมด ยังไม่เชื่อมกับ frontend (ดู types/order.ts)
// ─────────────────────────────────────────────────────────────
import type { Order } from "@/types/order";

let seq = 0;
const item = (product_name: string, quantity: number, unit_price: number) => {
  seq += 1;
  return {
    _id: `oi_${seq}`,
    product_id: `p_${seq}`,
    product_name,
    quantity,
    unit_price,
    total_price: unit_price * quantity,
  };
};

export const ordersFixture: Order[] = [
  {
    _id: "o_2101", order_no: "OP-20260831-2101", order_type: "delivery",
    user_id: "u_1", customer_name: "คุณสมชาย ใจดี", customer_phone: "081-234-5678",
    items: [item("เค้กช็อกโกแลตลาวา", 1, 399), item("คัพเค้กวานิลลา", 3, 60)],
    subtotal: 579, discount_amount: 0, delivery_fee: 0, total_amount: 579,
    order_status: "preparing", payment_status: "paid",
    created_at: "2026-08-31T08:05:00.000Z", updated_at: "2026-08-31T09:20:00.000Z",
  },
  {
    _id: "o_2100", order_no: "OP-20260901-2100", order_type: "takeaway",
    user_id: "u_2", customer_name: "คุณวรรณา พรทวี", customer_phone: "082-345-6789",
    items: [item("ขนมปังซาวโดว์", 2, 150)],
    subtotal: 300, discount_amount: 0, delivery_fee: 0, total_amount: 300,
    order_status: "pending", payment_status: "pending",
    created_at: "2026-09-01T07:40:00.000Z", updated_at: "2026-09-01T07:40:00.000Z",
  },
  {
    _id: "o_2099", order_no: "OP-20260831-2099", order_type: "delivery",
    user_id: "u_3", customer_name: "คุณอนุชา เพชรดี", customer_phone: "083-456-7890",
    items: [item("โรลเค้กชาเขียว", 2, 280)],
    subtotal: 560, discount_amount: 0, delivery_fee: 0, total_amount: 560,
    order_status: "confirmed", payment_status: "paid",
    created_at: "2026-08-31T09:50:00.000Z", updated_at: "2026-08-31T10:05:00.000Z",
  },
  {
    _id: "o_2098", order_no: "OP-20260829-2098", order_type: "takeaway",
    user_id: "u_4", customer_name: "คุณกิตติ ทองสุข", customer_phone: "084-567-8901",
    items: [item("คัพเค้กวานิลลา", 10, 60)],
    subtotal: 600, discount_amount: 0, delivery_fee: 0, total_amount: 600,
    order_status: "completed", payment_status: "paid",
    created_at: "2026-08-29T12:00:00.000Z", updated_at: "2026-08-29T15:30:00.000Z",
  },
  {
    _id: "o_2097", order_no: "OP-20260828-2097", order_type: "delivery",
    user_id: "u_5", customer_name: "คุณปิยะดา แสงจันทร์", customer_phone: "085-678-9012",
    items: [item("เค้กช็อกโกแลตลาวา", 1, 399)],
    subtotal: 399, discount_amount: 0, delivery_fee: 0, total_amount: 399,
    order_status: "cancelled", payment_status: "failed",
    created_at: "2026-08-28T11:20:00.000Z", updated_at: "2026-08-28T11:45:00.000Z",
  },
];
