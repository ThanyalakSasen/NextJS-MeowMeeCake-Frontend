// ─────────────────────────────────────────────────────────────
// src/services/shopPreorders.ts — พรีออเดอร์หน้าร้าน (BACKLOG3-merge D3)
//   รอบ (สาธารณะ): GET /catalog/preorder-rounds · /catalog/preorder-rounds/{id} (เฉพาะรายการที่เปิดขาย + ราคา/โควตาเหลือ)
//   ของฉัน (login): /shop/preorders (GET/POST) · /{id} · /{id}/cancel · ชำระเงินผ่าน shopPaymentsService (kind "preorder")
// กติกาของ backend หลัก (preorderService):
//   ขั้นต่ำต่อรายการ = max(รายการในรอบ, preorder_config ของสินค้า) · สูงสุดต่อคนต่อรอบ = preorder_config.max_order_qty
//   (รวมพรีออเดอร์เดิมในรอบ) · ไม่เกินโควตาเหลือของรอบ · ชำระภายใน 24 ชม. (ไม่เกินเวลาปิดรอบ) ไม่งั้นยกเลิกอัตโนมัติ
//   ลูกค้ายกเลิกเองได้เฉพาะ pending/confirmed ที่ยังไม่ชำระ · ไม่มีโค้ดส่วนลด (ใช้คูปองของฉัน + แต้มได้)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { DeliveryAddress, OrderType } from "@/types/order";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";
import type { CartCustomization } from "@/services/shopCart";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RoundStatus = "scheduled" | "open" | "closed" | "cancelled" | "completed";

export interface StorefrontRound {
  _id: string;
  round_name: string;
  open_date: string;
  close_date: string;
  /** วันรับวันแรก — รับได้ถึงอีก 12 วันตามวันที่จุดรับเปิด */
  pickup_date: string;
  round_status: RoundStatus;
  item_count?: number;
}

export interface RoundProduct {
  _id: string;
  product_name_th: string;
  product_name_eng: string;
  product_price: number;
  sale_price: number | null;
  product_img: string[];
  preorder_config: { min_order_qty: number | null; max_order_qty: number | null; lead_time_days: number | null } | null;
}

export interface StorefrontRoundItem {
  _id: string;
  round_id: string;
  product: RoundProduct;
  /** ราคาในรอบ (price_override หรือราคาขายจริง) — ยังไม่รวมตัวเลือก */
  current_price: number;
  min_order_qty: number;
  max_qty_total: number;
  remaining_qty: number;
}

export interface StorefrontRoundDetail extends StorefrontRound {
  items: StorefrontRoundItem[];
}

/** ขั้นต่ำ/สูงสุดที่ลูกค้าสั่งได้ต่อรายการ (สูงสุดยังไม่หักที่เคยสั่งในรอบนี้ — backend ตรวจซ้ำ) */
export function roundItemLimits(it: StorefrontRoundItem): { min: number; max: number } {
  const cfg = it.product.preorder_config;
  const min = Math.max(it.min_order_qty ?? 1, cfg?.min_order_qty ?? 1, 1);
  const max = Math.min(it.remaining_qty, cfg?.max_order_qty ?? Number.POSITIVE_INFINITY);
  return { min, max: Math.max(0, max) };
}

export interface ShopPreorderItem {
  _id: string;
  product_id: string;
  product_name: string;
  variant_name: string | null;
  selected_options: { option_name: string; text_value: string | null }[];
  special_request: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ShopPreorder {
  _id: string;
  preorder_no: string;
  round: { _id: string; round_name: string; pickup_date: string; close_date: string; round_status: RoundStatus } | null;
  order_type: OrderType;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_address: DeliveryAddress | null;
  subtotal: number;
  discount_amount: number;
  coupon_discount: number;
  points_redeemed: number;
  points_discount: number;
  delivery_fee: number;
  total_amount: number;
  items: ShopPreorderItem[];
  created_at: string;
  payment_due_at: string | null;
  /** มีรายการชำระเงินแล้ว (เคยส่งสลิป) */
  has_payment: boolean;
  cancelled_reason: string | null;
  pickup_point_name: string | null;
  pickup_date: string | null;
  delivery_status: string | null;
  tracking_no: string | null;
}

/** ลูกค้ายกเลิกเองได้ — pending/confirmed ที่ยังไม่ชำระ (backend CUSTOMER_CANCELABLE_STATUSES + ห้ามชำระแล้ว) */
export const canCustomerCancelPreorder = (p: Pick<ShopPreorder, "order_status" | "payment_status">) =>
  (p.order_status === "pending" || p.order_status === "confirmed") && p.payment_status !== "paid";

export interface CreatePreorderInput {
  round_id: string;
  order_type: OrderType;
  address_id?: string;
  recipient_name?: string;
  recipient_phone?: string;
  user_coupon_id?: string;
  points_to_redeem?: number;
  pickup_location_id?: string;
  pickup_date?: string;
  items: ({ round_item_id: string; quantity: number; special_request?: string | null } & CartCustomization)[];
}

function toRoundItem(raw: any): StorefrontRoundItem {
  const p = raw.product_id && typeof raw.product_id === "object" ? raw.product_id : {};
  return {
    _id: raw._id,
    round_id: raw.round_id,
    product: {
      _id: String(p._id ?? raw.product_id ?? ""),
      product_name_th: p.product_name_th ?? "",
      product_name_eng: p.product_name_eng ?? "",
      product_price: Number(p.product_price ?? 0),
      sale_price: p.sale_price ?? null,
      product_img: Array.isArray(p.product_img) ? p.product_img : [],
      preorder_config: p.preorder_config ?? null,
    },
    current_price: Number(raw.current_price ?? 0),
    min_order_qty: Number(raw.min_order_qty ?? 1),
    max_qty_total: Number(raw.max_qty_total ?? 0),
    remaining_qty: Number(raw.remaining_qty ?? 0),
  };
}

function toShopPreorder(raw: any): ShopPreorder {
  const r = raw.round_id && typeof raw.round_id === "object" ? raw.round_id : null;
  return {
    _id: raw._id,
    preorder_no: raw.preorder_no,
    round: r ? { _id: r._id, round_name: r.round_name, pickup_date: r.pickup_date, close_date: r.close_date, round_status: r.round_status } : null,
    order_type: raw.order_type,
    order_status: raw.order_status,
    payment_status: raw.payment_status,
    delivery_address: raw.delivery_address ?? null,
    subtotal: raw.subtotal ?? 0,
    discount_amount: raw.discount_amount ?? 0,
    coupon_discount: raw.coupon_discount ?? 0,
    points_redeemed: raw.points_redeemed ?? 0,
    points_discount: raw.points_discount ?? 0,
    delivery_fee: raw.delivery_fee ?? 0,
    total_amount: raw.total_amount ?? 0,
    items: Array.isArray(raw.items)
      ? raw.items.map((it: any) => ({
          _id: it._id,
          product_id: String(it.product_id?._id ?? it.product_id ?? ""),
          product_name: it.product_snapshot?.product_name_th ?? "",
          variant_name: it.product_snapshot?.variant_name ?? null,
          selected_options: Array.isArray(it.selected_options)
            ? it.selected_options.map((o: any) => ({ option_name: o.option_name ?? "", text_value: o.text_value ?? null }))
            : [],
          special_request: it.special_request ?? null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total_price: it.total_price,
        }))
      : [],
    created_at: raw.created_at,
    payment_due_at: raw.payment_due_at ?? null,
    has_payment: !!raw.payment_id,
    cancelled_reason: raw.cancelled_reason ?? null,
    pickup_point_name: raw.pickup_point?.point_name ?? null,
    pickup_date: raw.pickup_date ?? null,
    delivery_status: raw.delivery_status ?? null,
    tracking_no: raw.tracking_no ?? null,
  };
}

export const shopPreordersService = {
  /** GET /catalog/preorder-rounds — รอบ scheduled/open ที่ยังไม่ปิด (เรียงตามวันเปิด) */
  rounds: async (): Promise<StorefrontRound[]> =>
    (await http.getList<StorefrontRound>("/catalog/preorder-rounds", { params: { limit: 50 } })).data,

  /** GET /catalog/preorder-rounds/{id} — รอบ + รายการที่เปิดขาย (404 = ไม่มีรอบนี้) */
  round: async (id: string): Promise<StorefrontRoundDetail> => {
    const res = await http.get<ItemResponse<any>>(`/catalog/preorder-rounds/${encodeURIComponent(id)}`);
    return { ...res.data, items: (res.data.items ?? []).map(toRoundItem) };
  },

  /** POST /shop/preorders — 1 ใบต่อรอบ · ค่าส่ง/ส่วนลด/ราคา backend คิดเอง */
  create: async (body: CreatePreorderInput): Promise<ShopPreorder> =>
    toShopPreorder((await http.post<ItemResponse<any>>("/shop/preorders", body)).data),

  /** GET /shop/preorders — ของฉัน ใหม่สุดก่อน */
  list: async (params: { order_status?: OrderStatus; page?: number; limit?: number } = {}) => {
    const res = await http.getList<any>("/shop/preorders", { params: { sortBy: "created_at", sortOrder: "desc", ...params } });
    return { ...res, data: res.data.map(toShopPreorder) };
  },

  /** GET /shop/preorders/{id} — เฉพาะเจ้าของ (403 ถ้าไม่ใช่) */
  get: async (id: string): Promise<ShopPreorder> =>
    toShopPreorder((await http.get<ItemResponse<any>>(`/shop/preorders/${encodeURIComponent(id)}`)).data),

  /** POST /shop/preorders/{id}/cancel { reason? } — คืนโควตาในรอบ + คูปอง/แต้มให้ */
  cancel: async (id: string, reason?: string): Promise<void> => {
    await http.post(`/shop/preorders/${encodeURIComponent(id)}/cancel`, reason ? { reason } : {});
  },
};
