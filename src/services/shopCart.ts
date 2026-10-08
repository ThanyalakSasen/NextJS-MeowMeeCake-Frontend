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
    | { _id: string; product_name_th: string; product_name_eng?: string; product_img?: string[]; is_visible?: boolean; is_preorder?: boolean };
  /** แบบเดิม — ตัวเลือกเดียว (รายการเก่าก่อนมีกลุ่มตัวเลือก) */
  variant_id?: string | { _id: string; variant_name: string; variant_price: number } | null;
  /** ตัวเลือกที่เลือกทุกกลุ่ม (เช่น ขนาด: 2 ปอนด์) */
  selected_variants?: { group_name: string; variant_name: string; variant_price: number }[];
  /** ออปชันเสริม (เทียน · ข้อความบนเค้ก) — extra_price = ราคาบวกเพิ่มต่อชิ้น */
  selected_options?: { option_id: string | null; option_name: string; text_value: string | null; extra_price: number }[];
  quantity: number;
  /** ราคาต่อหน่วย (บาท) ณ ตอนใส่ตะกร้า */
  price_snapshot: number;
  line_total: number;
}

/** ตัวเลือกที่ส่งตอนใส่ตะกร้า (schemas/cart.addCartItemBody) */
export interface CartCustomization {
  variant_ids?: string[];
  selected_options?: { option_id: string; text_value?: string | null }[];
}

/** ข้อความตัวเลือกของรายการในตะกร้า — "ขนาด: 2 ปอนด์ · ข้อความบนเค้ก: HBD" (null = ไม่มีตัวเลือก) */
export function cartItemOptionText(it: Pick<ShopCartItem, "variant_id" | "selected_variants" | "selected_options">): string | null {
  const parts: string[] = [];
  const variants = it.selected_variants ?? [];
  if (variants.length) {
    const byGroup = new Map<string, string[]>();
    for (const v of variants) byGroup.set(v.group_name, [...(byGroup.get(v.group_name) ?? []), v.variant_name]);
    for (const [group, names] of byGroup) parts.push(group ? `${group}: ${names.join(", ")}` : names.join(", "));
  } else if (it.variant_id && typeof it.variant_id === "object") {
    parts.push(it.variant_id.variant_name);
  }
  for (const o of it.selected_options ?? []) parts.push(o.text_value ? `${o.option_name}: ${o.text_value}` : o.option_name);
  return parts.length ? parts.join(" · ") : null;
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
   * POST /shop/cart/items { product_id, quantity, variant_ids?, selected_options? } — backend คิดราคาจาก DB เอง
   * สินค้ามีกลุ่มบังคับเลือกแต่ไม่ส่ง = 400 · สินค้า + ชุดตัวเลือกเดียวกับที่มีอยู่ = รวมจำนวน (คนละชุด = คนละบรรทัด)
   */
  addItem: (body: { product_id: string; quantity: number } & CartCustomization) =>
    http.post<ItemResponse<ShopCartItem>>("/shop/cart/items", body),

  /** PATCH /shop/cart/items/{id} { quantity } — quantity = 0 = ลบรายการ */
  updateQuantity: (itemId: string, quantity: number) =>
    http.patch<ItemResponse<ShopCartItem>>(`/shop/cart/items/${itemId}`, { quantity }),

  /** DELETE /shop/cart/items/{id} */
  removeItem: (itemId: string) => http.delete<EmptyResponse>(`/shop/cart/items/${itemId}`),
};
