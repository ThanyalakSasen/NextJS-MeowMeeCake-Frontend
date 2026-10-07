// ─────────────────────────────────────────────────────────────
// src/services/shopFavorites.ts — รายการโปรดของฉัน (/shop/favorites) · หน้าร้าน (BACKLOG3-merge D5)
// backend favoriteService: เก็บใน Interactions (wishlist) · เพิ่มซ้ำ = ไม่ซ้ำแถว · เอาออกสิ่งที่ไม่มี = ไม่ error
// response GET เป็นรูปแบบเดิมของฝั่งลูกค้า ({ items: [{ id, name, ... }] }) ไม่ใช่ { items, meta } ของ list ทั่วไป
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";

export interface FavoriteItem {
  /** _id ของสินค้า */
  id: string;
  name: string;
  nameeg: string;
  category: string;
  /** ราคาขายจริง (ราคาลดถ้ามี) */
  price: number;
  /** ราคาปกติไว้ขีดฆ่า — null ถ้าไม่ลดราคา */
  originalPrice: number | null;
  /** path รูปแรก (ผ่าน resolveUploadUrl ก่อนแสดง) · "" = ไม่มีรูป */
  image: string;
  /** ยังเปิดขาย (is_visible) — ไม่ได้ดูสต็อก */
  inStock: boolean;
  /** คะแนนเฉลี่ยเป็นข้อความ · "-" = ยังไม่มีรีวิว */
  rating: string;
  is_preorder: boolean;
}

export const shopFavoritesService = {
  /** GET /shop/favorites — ล่าสุดก่อน · สินค้าที่ถูกลบไม่แสดง */
  list: async (): Promise<FavoriteItem[]> =>
    (await http.get<ItemResponse<{ items: FavoriteItem[] }>>("/shop/favorites")).data.items ?? [],
  /** POST /shop/favorites { productId } — สินค้าไม่มี = 404 */
  add: async (productId: string): Promise<void> => {
    await http.post("/shop/favorites", { productId });
  },
  /** DELETE /shop/favorites?productId= */
  remove: async (productId: string): Promise<void> => {
    await http.delete("/shop/favorites", { params: { productId } });
  },
};
