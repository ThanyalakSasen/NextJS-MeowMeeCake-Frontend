// ─────────────────────────────────────────────────────────────
// src/services/shopCart.ts — ตะกร้าของลูกค้าที่ login (/shop/cart*) · หน้าร้าน
// แทน /api/customer/cart-items/* ของ backend port 4000 เดิม (FrontOffice — เลิกใช้แล้ว)
// shape จริง: cartService.getCartDetail() ฝั่ง backend
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";

export interface ShopCartItem {
  _id: string;
  /** backend populate เป็น object (ชื่อ/รูป/การแสดงผล) */
  product_id:
    | string
    | { _id: string; product_name_th: string; product_name_eng?: string; product_img?: string[]; is_visible?: boolean };
  variant_id?: string | { _id: string; variant_name: string; variant_price: number } | null;
  quantity: number;
  /** ราคาต่อหน่วย (บาท) ณ ตอนใส่ตะกร้า */
  price_snapshot: number;
  line_total: number;
}

export interface ShopCart {
  cart: { _id: string; user_id: string };
  items: ShopCartItem[];
  summary: { item_count: number; total_quantity: number; subtotal: number };
}

export const shopCartService = {
  /** GET /shop/cart — ตะกร้าพร้อมรายการและยอดรวม (backend สร้างตะกร้าให้อัตโนมัติ) · ต้อง login */
  get: async (): Promise<ShopCart> => {
    const res = await http.get<ItemResponse<ShopCart>>("/shop/cart");
    return res.data;
  },

  /**
   * POST /shop/cart/items { product_id, quantity, variant_id? } — backend คิดราคาจาก DB เอง (ไม่รับราคาจาก client)
   * สินค้ามีตัวเลือก (variant) ต้องส่ง variant_id ไม่งั้น 400 — ยังไม่มีสินค้าแบบนี้ (BACKLOG2 §6)
   */
  addItem: (body: { product_id: string; quantity: number; variant_id?: string }) =>
    http.post<ItemResponse<ShopCartItem>>("/shop/cart/items", body),

  /** PATCH /shop/cart/items/{id} { quantity } — quantity = 0 = ลบรายการ */
  updateQuantity: (itemId: string, quantity: number) =>
    http.patch<ItemResponse<ShopCartItem>>(`/shop/cart/items/${itemId}`, { quantity }),

  /** DELETE /shop/cart/items/{id} */
  removeItem: (itemId: string) => http.delete<EmptyResponse>(`/shop/cart/items/${itemId}`),
};
