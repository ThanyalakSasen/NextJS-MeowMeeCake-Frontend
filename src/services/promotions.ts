// เรียก endpoint /admin/promotions (promotionModel.ts จริงฝั่ง backend) — แพทเทิร์นเดียวกับ services/products.ts
//
// normalize ทุกครั้งที่อ่าน: applicable_products/applicable_categories/applicable_channels เป็น
// [String] ที่มี default: [] ใน schema ก็จริง แต่ default ใช้เฉพาะตอน insert ผ่าน Mongoose เท่านั้น —
// เอกสารเก่าที่เคยถูกสร้างก่อน field พวกนี้เพิ่มเข้ามา (หรือ insert ทางอื่นที่ข้าม Mongoose) จะไม่มี
// field นี้เลย อ่านออกมาเป็น undefined ตรง ๆ (บั๊กคลาสเดียวกับ product_type: "ready" ที่ค้างจากข้อมูลเก่า)
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Promotion, PromotionInput, PromotionListParams } from "@/types/promotion";

const BASE = "/admin/promotions";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toPromotion(raw: any): Promotion {
  return {
    ...raw,
    applicable_products: raw.applicable_products ?? [],
    applicable_categories: raw.applicable_categories ?? [],
    applicable_channels: raw.applicable_channels?.length ? raw.applicable_channels : ["online", "instore"],
  };
}

export const promotionsService = {
  list: async (params: PromotionListParams = {}) => {
    const res = await http.getList<any>(BASE, { params });
    return { ...res, data: res.data.map(toPromotion) };
  },

  get: async (id: string) => {
    const res = await http.get<ItemResponse<any>>(`${BASE}/${id}`);
    return { data: toPromotion(res.data) };
  },

  create: async (body: PromotionInput) => {
    const res = await http.post<ItemResponse<any>>(BASE, body);
    return { data: toPromotion(res.data) };
  },

  update: async (id: string, body: Partial<PromotionInput>) => {
    const res = await http.patch<ItemResponse<any>>(`${BASE}/${id}`, body);
    return { data: toPromotion(res.data) };
  },

  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
