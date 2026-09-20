// เรียก endpoint /admin/reviews (reviewModel.ts จริงฝั่ง backend) — อ่าน + ควบคุมการแสดงผลเท่านั้น
// permission module จริงคือ "products" ทุก endpoint (products.view/update/delete) ไม่ใช่ "reports"
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Review, ReviewListParams, SentimentResult } from "@/types/review";

const BASE = "/admin/reviews";

/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeScore(raw: any): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "object" && "$numberDecimal" in raw) return Number(raw.$numberDecimal);
  return Number(raw) || 0;
}

export const reviewsService = {
  list: (params: ReviewListParams = {}) => http.getList<Review>(BASE, { params }),
  get: (id: string) => http.get<ItemResponse<Review>>(`${BASE}/${id}`),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
  setVisibility: (id: string, is_visible: boolean) =>
    http.patch<ItemResponse<Review>>(`${BASE}/${id}/visibility`, { is_visible }),

  /** ผลวิเคราะห์ sentiment รายรีวิว — มีเฉพาะรีวิวที่ is_analyzed แล้ว, fetch แยกตอนเปิดดูรายละเอียดเท่านั้น */
  sentiment: async (id: string): Promise<SentimentResult[]> => {
    const res = await http.get<{ data: { review_id: string; results: any[] } }>(`${BASE}/${id}/sentiment`);
    return res.data.results.map((r) => ({ ...r, sentiment_score: normalizeScore(r.sentiment_score) }));
  },
};
