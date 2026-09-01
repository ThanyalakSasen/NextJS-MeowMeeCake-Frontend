// ─────────────────────────────────────────────────────────────
// src/mocks/fixtures/orders.ts  — MOCK (D17)
// ผสมสถานะ/การชำระเงินให้ครบเคส: ไม่มีสลิป · แนบสลิปแล้วรอตรวจ · ตรวจแล้ว · ยกเลิก · จบแล้ว
// ─────────────────────────────────────────────────────────────
import type { Order } from "@/types/order";

/** placeholder สลิปโอนเงิน — SVG data URI ใช้งานได้ offline ไม่ต้องพึ่ง network */
const SLIP =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23F1E4DC'/%3E%3Ctext x='50%25' y='50%25' font-size='16' text-anchor='middle' dominant-baseline='middle' fill='%234B2E2B' font-family='sans-serif'%3ESlip%3C/text%3E%3C/svg%3E";

export const ordersFixture: Order[] = [
  {
    _id: "o_2101", order_no: "ORD-2101", order_type: "ready",
    customer_name: "คุณสมชาย ใจดี", customer_phone: "081-234-5678",
    items: [{ product_name: "เค้กช็อกโกแลตลาวา", quantity: 1 }, { product_name: "คัพเค้กวานิลลา", quantity: 3 }],
    total_amount: 579, order_status: "preparing", payment_status: "paid",
    payment_slip_url: SLIP, payment_verified_at: "2026-08-31T09:20:00.000Z",
    due_date: "2026-08-31T00:00:00.000Z",
    created_at: "2026-08-31T08:05:00.000Z", updated_at: "2026-08-31T09:20:00.000Z",
  },
  {
    _id: "o_2100", order_no: "ORD-2100", order_type: "ready",
    customer_name: "คุณวรรณา พรทวี", customer_phone: "082-345-6789",
    items: [{ product_name: "ขนมปังซาวโดว์", quantity: 2 }],
    total_amount: 300, order_status: "pending", payment_status: "pending",
    payment_slip_url: null, payment_verified_at: null,
    due_date: "2026-09-01T00:00:00.000Z",
    created_at: "2026-09-01T07:40:00.000Z", updated_at: "2026-09-01T07:40:00.000Z",
  },
  {
    _id: "o_2099", order_no: "ORD-2099", order_type: "ready",
    customer_name: "คุณอนุชา เพชรดี", customer_phone: "083-456-7890",
    items: [{ product_name: "โรลเค้กชาเขียว", quantity: 2 }],
    total_amount: 560, order_status: "confirmed", payment_status: "paid",
    payment_slip_url: SLIP, payment_verified_at: "2026-08-31T10:05:00.000Z",
    due_date: "2026-08-31T00:00:00.000Z",
    created_at: "2026-08-31T09:50:00.000Z", updated_at: "2026-08-31T10:05:00.000Z",
  },
  {
    _id: "o_2098", order_no: "ORD-2098", order_type: "ready",
    customer_name: "คุณกิตติ ทองสุข", customer_phone: "084-567-8901",
    items: [{ product_name: "คัพเค้กวานิลลา", quantity: 10 }],
    total_amount: 600, order_status: "completed", payment_status: "paid",
    payment_slip_url: SLIP, payment_verified_at: "2026-08-29T13:15:00.000Z",
    due_date: "2026-08-29T00:00:00.000Z",
    created_at: "2026-08-29T12:00:00.000Z", updated_at: "2026-08-29T15:30:00.000Z",
  },
  {
    _id: "o_2097", order_no: "ORD-2097", order_type: "ready",
    customer_name: "คุณปิยะดา แสงจันทร์", customer_phone: "085-678-9012",
    items: [{ product_name: "เค้กช็อกโกแลตลาวา", quantity: 1 }],
    total_amount: 399, order_status: "cancelled", payment_status: "failed",
    payment_slip_url: null, payment_verified_at: null,
    due_date: "2026-08-28T00:00:00.000Z",
    created_at: "2026-08-28T11:20:00.000Z", updated_at: "2026-08-28T11:45:00.000Z",
  },
  {
    _id: "o_3051", order_no: "PRE-3051", order_type: "preorder",
    customer_name: "คุณธนพล ศรีสุข", customer_phone: "086-789-0123",
    items: [{ product_name: "สตรอว์เบอร์รีชอร์ตเค้ก", quantity: 2 }],
    total_amount: 1040, order_status: "pending", payment_status: "pending",
    payment_slip_url: SLIP, payment_verified_at: null,
    due_date: "2026-09-06T00:00:00.000Z", lead_time_days: 7,
    created_at: "2026-08-30T10:00:00.000Z", updated_at: "2026-08-30T10:00:00.000Z",
  },
  {
    _id: "o_3050", order_no: "PRE-3050", order_type: "preorder",
    customer_name: "คุณมัลลิกา บุญมี", customer_phone: "087-890-1234",
    items: [{ product_name: "สตรอว์เบอร์รีชอร์ตเค้ก", quantity: 1 }, { product_name: "โรลเค้กชาเขียว", quantity: 1 }],
    total_amount: 800, order_status: "preparing", payment_status: "paid",
    payment_slip_url: SLIP, payment_verified_at: "2026-08-27T16:40:00.000Z",
    due_date: "2026-09-03T00:00:00.000Z", lead_time_days: 7,
    created_at: "2026-08-27T15:00:00.000Z", updated_at: "2026-08-27T16:40:00.000Z",
  },
  {
    _id: "o_3049", order_no: "PRE-3049", order_type: "preorder",
    customer_name: "คุณเอกพล วงศ์ษา", customer_phone: "088-901-2345",
    items: [{ product_name: "เค้กช็อกโกแลตลาวา", quantity: 3 }],
    total_amount: 1197, order_status: "ready", payment_status: "paid",
    payment_slip_url: SLIP, payment_verified_at: "2026-08-25T09:30:00.000Z",
    due_date: "2026-09-02T00:00:00.000Z", lead_time_days: 8,
    created_at: "2026-08-25T09:00:00.000Z", updated_at: "2026-08-31T18:00:00.000Z",
  },
  {
    _id: "o_3048", order_no: "PRE-3048", order_type: "preorder",
    customer_name: "คุณสุภาภรณ์ ดวงดี", customer_phone: "089-012-3456",
    items: [{ product_name: "ขนมปังซาวโดว์", quantity: 4 }],
    total_amount: 600, order_status: "confirmed", payment_status: "paid",
    payment_slip_url: SLIP, payment_verified_at: "2026-08-29T14:10:00.000Z",
    due_date: "2026-09-05T00:00:00.000Z", lead_time_days: 7,
    created_at: "2026-08-29T13:00:00.000Z", updated_at: "2026-08-29T14:10:00.000Z",
  },
];
