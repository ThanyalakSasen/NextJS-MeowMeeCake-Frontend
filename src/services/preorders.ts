// ─────────────────────────────────────────────────────────────
// src/services/preorders.ts — เรียก /admin/preorders* (preorderModel/preorderItemModel จริงฝั่ง backend)
// backend populate user_id/round_id เป็น object เต็มเสมอ — แปลงเป็น customer_name/customer_phone/
// round_name ที่นี่จุดเดียว (แพทเทิร์นเดียวกับ services/orders.ts toOrder())
//
// ไม่มี create/update ทั่วไป — แอดมินไม่สร้างพรีออเดอร์แทนลูกค้าในหน้านี้ มีแค่ดู + เปลี่ยนสถานะ
// (ขอบเขตที่ยืนยันแล้ว — ดู types/preorder.ts หัวไฟล์)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { Preorder, PreorderItem, PreorderListParams } from "@/types/preorder";
import { refId } from "@/lib/refId";

const BASE = "/admin/preorders";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toPreorderItem(raw: any): PreorderItem {
  return {
    _id: raw._id,
    preorder_id: raw.preorder_id,
    round_item_id: raw.round_item_id,
    product_id: refId(raw.product_id),
    product_name: raw.product_snapshot?.product_name_th ?? "",
    pickup_date: raw.pickup_date,
    special_request: raw.special_request ?? null,
    quantity: raw.quantity,
    unit_price: raw.unit_price,
    total_price: raw.total_price,
  };
}

function toPreorder(raw: any): Preorder {
  const user = typeof raw.user_id === "string" ? null : raw.user_id;
  const round = typeof raw.round_id === "string" ? null : raw.round_id;
  return {
    _id: raw._id,
    preorder_no: raw.preorder_no,
    user_id: refId(raw.user_id),
    customer_name: user?.user_fullname ?? "-",
    customer_phone: user?.user_phone ?? "-",
    round_id: refId(raw.round_id),
    round_name: round?.round_name ?? "-",
    round_pickup_date: round?.pickup_date,
    round_status: round?.round_status,
    order_type: raw.order_type,
    order_status: raw.order_status,
    payment_status: raw.payment_status,
    delivery_address: raw.delivery_address ?? null,
    subtotal: raw.subtotal,
    discount_amount: raw.discount_amount ?? 0,
    delivery_fee: raw.delivery_fee ?? 0,
    total_amount: raw.total_amount,
    cancelled_reason: raw.cancelled_reason ?? null,
    items: Array.isArray(raw.items) ? raw.items.map(toPreorderItem) : undefined,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export const preordersService = {
  list: async (params: PreorderListParams = {}) => {
    const res = await http.getList<any>(BASE, { params });
    return { ...res, data: res.data.map(toPreorder) };
  },

  get: async (id: string) => {
    const res = await http.get<ItemResponse<any>>(`${BASE}/${id}`);
    return { data: toPreorder(res.data) };
  },

  // backend ไม่มี PATCH /admin/preorders/[id] ตรง ๆ — เปลี่ยนสถานะต้องผ่าน /status เท่านั้น (เหมือน orders.ts)
  updateStatus: async (id: string, order_status: string, cancelled_reason?: string) => {
    const res = await http.patch<ItemResponse<any>>(`${BASE}/${id}/status`, { order_status, cancelled_reason });
    return { data: toPreorder(res.data) };
  },
};
