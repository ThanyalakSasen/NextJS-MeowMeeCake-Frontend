// ─────────────────────────────────────────────────────────────
// src/services/orders.ts — เรียก /admin/orders (orderModel.ts จริงฝั่ง backend)
// backend populate user_id เป็น object เต็ม — แปลงเป็น customer_name/customer_phone ที่นี่จุดเดียว
// (ดู types/order.ts หัวไฟล์สำหรับข้อจำกัด: ไม่มีพรีออเดอร์, items ไม่มาใน list)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Order, OrderInput, OrderLineItem, OrderListParams } from "@/types/order";
import { refId } from "@/lib/refId";

const BASE = "/admin/orders";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toOrder(raw: any): Order {
  const user = typeof raw.user_id === "string" ? null : raw.user_id;
  const items: OrderLineItem[] | undefined = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        _id: it._id,
        product_id: refId(it.product_id),
        product_name: it.product_snapshot?.product_name_th ?? "",
        variant_name: it.product_snapshot?.variant_name ?? null,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        special_request: it.special_request ?? null,
      }))
    : undefined;

  return {
    _id: raw._id,
    order_no: raw.order_no,
    order_type: raw.order_type,
    user_id: refId(raw.user_id),
    customer_name: user?.user_fullname ?? "-",
    customer_phone: user?.user_phone ?? "-",
    items,
    subtotal: raw.subtotal,
    discount_amount: raw.discount_amount ?? 0,
    delivery_fee: raw.delivery_fee ?? 0,
    total_amount: raw.total_amount,
    order_status: raw.order_status,
    payment_status: raw.payment_status,
    delivery_address: raw.delivery_address ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export const ordersService = {
  list: async (params: OrderListParams = {}) => {
    const res = await http.getList<any>(BASE, { params });
    return { ...res, data: res.data.map(toOrder) };
  },

  get: async (id: string) => {
    const res = await http.get<ItemResponse<any>>(`${BASE}/${id}`);
    return { data: toOrder(res.data) };
  },

  create: async (body: OrderInput) => {
    const res = await http.post<ItemResponse<any>>(BASE, body);
    return { data: toOrder(res.data) };
  },

  // backend ไม่มี PATCH /admin/orders/[id] ตรง ๆ — เปลี่ยนสถานะออเดอร์ต้องผ่าน /status เท่านั้น
  updateStatus: async (id: string, order_status: string, cancelled_reason?: string) => {
    const res = await http.patch<ItemResponse<any>>(`${BASE}/${id}/status`, { order_status, cancelled_reason });
    return { data: toOrder(res.data) };
  },

  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
