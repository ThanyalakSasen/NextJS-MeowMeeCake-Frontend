// ─────────────────────────────────────────────────────────────
// src/services/shopOrders.ts — ออเดอร์ของลูกค้าที่ login (/shop/orders*) + ค่าส่ง + โค้ดโปรโมชัน · หน้าร้าน
// สั่งจากตะกร้า (source "cart" — backend ล้างตะกร้าให้หลังสร้างสำเร็จ) · ค่าส่ง/ส่วนลด backend คิดเองทั้งหมด
// (ไม่รับ delivery_fee/discount_amount จาก client) · เงินเป็นบาท
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { DeliveryAddress, OrderType } from "@/types/order";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ShopOrderItem {
  _id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ShopOrder {
  _id: string;
  order_no: string;
  order_type: OrderType;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_address: DeliveryAddress | null;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  /** มีเฉพาะ get(id) */
  items: ShopOrderItem[];
  created_at: string;
}

export interface CreateShopOrderInput {
  order_type: OrderType;
  /** ที่อยู่จากสมุด — ต้องมี recipient_name/recipient_phone คู่กัน */
  address_id?: string;
  recipient_name?: string;
  recipient_phone?: string;
  promotion_code?: string;
}

/**
 * ค่าส่งของออเดอร์เว็บ — คิดจาก ShippingZones ตามจังหวัด + ขอบเขตจัดส่ง (backend docs/customer-backend-merge.md §8.7)
 * ส่งไม่ได้ (มีสินค้าที่ส่งเฉพาะจังหวัดร้าน) → deliverable: false + message (ตอบ 200 ไม่ใช่ error)
 * ไม่มีส่งฟรีตามยอดแล้ว (free_shipping_min เป็น null เสมอ) — ส่งฟรีได้จากโปรโมชันเท่านั้น
 */
export interface DeliveryQuote {
  deliverable: boolean;
  /** เหตุผลที่ส่งไม่ได้ — มีเฉพาะ deliverable: false */
  message: string | null;
  /** null เมื่อส่งไม่ได้ */
  fee: number | null;
  free: boolean;
  zone: string | null;
  zone_code: string | null;
  free_shipping_min: null;
}

export interface PromotionCheck {
  discount_amount: number;
  free_shipping: boolean;
  promotion_code: string;
}

function toShopOrder(raw: any): ShopOrder {
  return {
    _id: raw._id,
    order_no: raw.order_no,
    order_type: raw.order_type,
    order_status: raw.order_status,
    payment_status: raw.payment_status,
    delivery_address: raw.delivery_address ?? null,
    subtotal: raw.subtotal ?? 0,
    discount_amount: raw.discount_amount ?? 0,
    delivery_fee: raw.delivery_fee ?? 0,
    total_amount: raw.total_amount ?? 0,
    items: Array.isArray(raw.items)
      ? raw.items.map((it: any) => ({
          _id: it._id,
          product_name: it.product_snapshot?.product_name_th ?? "",
          variant_name: it.product_snapshot?.variant_name ?? null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total_price: it.total_price,
        }))
      : [],
    created_at: raw.created_at,
  };
}

export const shopOrdersService = {
  /** POST /shop/orders (source "cart") — สร้างออเดอร์จากตะกร้าปัจจุบัน */
  create: async (body: CreateShopOrderInput): Promise<ShopOrder> => {
    const res = await http.post<ItemResponse<any>>("/shop/orders", { source: "cart", ...body });
    return toShopOrder(res.data);
  },

  /** GET /shop/orders/{id} — ออเดอร์ + รายการสินค้า (เฉพาะเจ้าของ) */
  get: async (id: string): Promise<ShopOrder> => {
    const res = await http.get<ItemResponse<any>>(`/shop/orders/${id}`);
    return toShopOrder(res.data);
  },

  /** POST /shop/orders/delivery-quote { province } — ค่าส่งจากจังหวัด + ขอบเขตจัดส่งของสินค้าในตะกร้าปัจจุบัน */
  deliveryQuote: async (province: string): Promise<DeliveryQuote> => {
    const res = await http.post<ItemResponse<DeliveryQuote>>("/shop/orders/delivery-quote", { province });
    return res.data;
  },

  /** POST /shop/promotions/validate { code, delivery_fee } — ไม่ผ่านเงื่อนไข = 422 พร้อมข้อความ */
  validatePromotion: async (code: string, deliveryFee: number): Promise<PromotionCheck> => {
    const res = await http.post<ItemResponse<PromotionCheck>>("/shop/promotions/validate", {
      code,
      delivery_fee: deliveryFee,
    });
    return res.data;
  },
};
