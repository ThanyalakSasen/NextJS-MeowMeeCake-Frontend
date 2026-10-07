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
import type { ProductCustomization } from "@/types/productCustomization";
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

/** รีวิวที่แสดงได้ของสินค้า — reviewService.toPublicReview ฝั่ง backend (ปักหมุดก่อน แล้วใหม่ก่อน) */
export interface CatalogReview {
  _id: string;
  rating: number;
  review_text?: string | null;
  image?: string[];
  /** path วิดีโอ (ผ่าน resolveUploadUrl) */
  video?: string | null;
  /** ชื่อผู้รีวิวที่ backend ปิดบางส่วนแล้ว ("K. Som***") — แสดงตรง ๆ ได้ */
  reviewer_name?: string;
  /** รูปเดิม (populate) — user_fullname = ชื่อที่ปิดบางส่วนแล้วเหมือน reviewer_name */
  user_id?: { _id?: string; user_fullname?: string; user_img?: string | null } | string | null;
  /** แง่มุมที่ลูกค้าเลือกตอนรีวิว (รสชาติ · บรรจุภัณฑ์ ฯลฯ) */
  aspect_feedback?: { aspect_id: string; aspect_name_th: string; sentiment: string }[];
  is_pinned?: boolean;
  shop_reply?: { text: string; replied_at: string | null } | null;
  from_preorder?: boolean;
  created_at: string;
}

/** GET /catalog/products/{id}/sentiment — สรุปความรู้สึกรายแง่มุม (sentimentService.getProductAspectSummary) */
export interface AspectSentiment {
  aspect_id: string;
  aspect: { aspect_name_th?: string; aspect_name_eng?: string } | null;
  total: number;
  positive: number;
  negative: number;
  neutral: number;
}

export type AllergenWarningLevel = "none" | "caution" | "warning" | "danger";

/** คำเตือนแพ้อาหารของระบบแนะนำ (backend types/recommendation.ts) — มีเมื่อ login + บันทึกอาหารที่แพ้ไว้ */
export interface AllergenWarning {
  level: AllergenWarningLevel;
  message: string | null;
  matchedAllergens: { name: string; severity: "moderate" | "severe"; isMainIngredient: boolean }[];
}

export interface SimilarProduct {
  product: Product;
  /** เหตุผลที่แนะนำ (ภาษาไทยจาก backend) */
  reasons: string[];
  allergenWarning: AllergenWarning | null;
}

/**
 * สินค้าจากระบบแนะนำมี category_name แทน category_id ที่ populate → แปลงให้เหมือน /catalog/products
 * (ProductCard อ่านชื่อหมวดจาก category_id.product_category_name)
 */
function toRecommendedProduct(raw: any): Product {
  const p = toProduct(raw);
  if (raw?.category_name && (typeof p.category_id !== "object" || !p.category_id)) {
    return { ...p, category_id: { _id: String(raw.category_id ?? ""), product_category_name: String(raw.category_name) } } as Product;
  }
  return p;
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

  /** GET /catalog/products/{id}/customization — กลุ่มตัวเลือก + ออปชันเสริม (ไม่มี = ว่างทั้งคู่) */
  customization: async (id: string): Promise<ProductCustomization> => {
    const res = await http.get<ItemResponse<ProductCustomization>>(`/catalog/products/${encodeURIComponent(id)}/customization`);
    return { groups: res.data?.groups ?? [], options: res.data?.options ?? [] };
  },

  /** GET /catalog/products/{id}/sentiment — แง่มุมที่ลูกค้าพูดถึงในรีวิว (บวก/ลบ/กลาง) */
  sentiment: async (id: string): Promise<AspectSentiment[]> => {
    const res = await http.get<ItemResponse<{ aspects?: AspectSentiment[] }>>(`/catalog/products/${encodeURIComponent(id)}/sentiment`);
    return res.data?.aspects ?? [];
  },

  /** GET /catalog/products/{id}/similar — สินค้าคล้ายกัน · login แล้ว = ปรับตามผู้ใช้ + คำเตือนแพ้อาหาร (ส่ง cookie อยู่แล้ว) */
  similar: async (id: string, limit = 10): Promise<SimilarProduct[]> => {
    const res = await http.get<ItemResponse<{ recommendations?: any[] }>>(`/catalog/products/${encodeURIComponent(id)}/similar`, {
      params: { limit },
    });
    return (res.data?.recommendations ?? [])
      .filter((r) => r?.product)
      .map((r) => ({ product: toRecommendedProduct(r.product), reasons: r.reasons ?? [], allergenWarning: r.allergenWarning ?? null }));
  },
};
