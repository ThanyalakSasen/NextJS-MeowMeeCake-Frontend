// ─────────────────────────────────────────────────────────────
// src/services/catalog.ts — ข้อมูลหน้าร้านแบบสาธารณะ (/catalog/*) ไม่ต้อง login
// แทน /api/customer/products · product-categories · banners ของ backend port 4000 เดิม (FrontOffice — เลิกใช้แล้ว)
// สินค้าผ่าน toProduct() ตัวเดียวกับหลังร้าน (normalize avg_rating Decimal128 + is_preorder)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { Product } from "@/types/product";
import type { ProductCategory } from "@/types/productCategory";
import type { Banner } from "@/types/banner";
import { toProduct } from "@/services/products";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CatalogProductParams {
  search?: string;
  category_id?: string;
  /** false = สินค้าปกติ (พร้อมขาย) · true = พรีออเดอร์ · ไม่ส่ง = ทั้งหมด */
  is_preorder?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** reviewService.getProductReviewSummary ฝั่ง backend — average เป็น null เมื่อยังไม่มีรีวิว (แปลงเป็น 0 ให้แล้ว) */
export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<string, number>;
}

/** รีวิวที่ is_visible ของสินค้า — reviewService.listReviews (publicOnly) ฝั่ง backend */
export interface CatalogReview {
  _id: string;
  rating: number;
  review_text?: string | null;
  image?: string[];
  /** backend populate { user_fullname, user_img } — ชื่อเต็ม ⚠️ หน้าร้านต้องปิดบังเองก่อนแสดง */
  user_id?: { _id: string; user_fullname?: string; user_img?: string | null } | string | null;
  created_at: string;
}

export const catalogService = {
  /** GET /catalog/products — เฉพาะสินค้าที่ is_visible (backend กรองให้) · populate category_id/unit_id */
  products: async (params: CatalogProductParams = {}) => {
    const res = await http.getList<any>("/catalog/products", { params });
    return { ...res, data: res.data.map(toProduct) as Product[] };
  },

  /** GET /catalog/products/{id} — 404 ถ้าสินค้าถูกซ่อน */
  product: async (id: string): Promise<Product> => {
    const res = await http.get<ItemResponse<any>>(`/catalog/products/${encodeURIComponent(id)}`);
    return toProduct(res.data);
  },

  /** GET /catalog/categories — หมวดหมู่สินค้า (backend ห่อ { items, meta }) */
  categories: async (): Promise<ProductCategory[]> => (await http.getList<ProductCategory>("/catalog/categories")).data,

  /** GET /catalog/banners — แบนเนอร์ที่เปิดใช้งาน เรียงตาม sort_order (ช่วงวันที่หน้าร้านกรองเอง) */
  banners: async (): Promise<Banner[]> => (await http.getList<Banner>("/catalog/banners")).data,

  /** GET /catalog/products/{id}/reviews — รีวิวที่แสดงได้ (?rating= กรองดาว) · backend ห่อ { items, meta } */
  reviews: async (id: string, params: { rating?: number; limit?: number } = {}): Promise<CatalogReview[]> =>
    (await http.getList<CatalogReview>(`/catalog/products/${encodeURIComponent(id)}/reviews`, { params: { limit: 100, ...params } }))
      .data,

  /** GET /catalog/ingredients — รายชื่อวัตถุดิบ (สาธารณะ) ให้ลูกค้าเลือกอาหารที่แพ้ · ไม่มีต้นทุน/สต็อก */
  ingredients: async (): Promise<{ _id: string; ingredient_name: string }[]> => {
    const res = await http.get<ItemResponse<{ ingredients?: { _id: string; ingredient_name: string }[] }>>("/catalog/ingredients");
    return res.data?.ingredients ?? [];
  },

  /** GET /catalog/products/{id}/reviews/summary — คะแนนเฉลี่ย + จำนวนรีวิว */
  reviewSummary: async (id: string): Promise<ReviewSummary> => {
    const res = await http.get<ItemResponse<any>>(`/catalog/products/${encodeURIComponent(id)}/reviews/summary`);
    const d = res.data ?? {};
    return { average: Number(d.average) || 0, count: Number(d.count) || 0, distribution: d.distribution ?? {} };
  },
};
