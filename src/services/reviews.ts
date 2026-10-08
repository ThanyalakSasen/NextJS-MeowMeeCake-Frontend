// ─────────────────────────────────────────────────────────────
// src/services/reviews.ts — รีวิวหลังร้าน (BACKLOG4 E4 · backend §8.20) · สิทธิ์เมนู reports ทุก endpoint
//   /admin/reviews            กรอง/เรียง/แบ่งหน้าที่ server + summary=1 (สรุปของชุดที่กรอง — I9)
//   /admin/reviews/:id        PATCH จัดการ (สถานะ · ปักหมุด · ตอบกลับ · แท็ก/โน้ตภายใน · อ่านแล้ว) · DELETE (soft)
//   /admin/reviews/bulk       อ่านแล้ว/ยังไม่อ่านหลายรายการ (≤ 200)
//   /admin/reviews/filter-options   สินค้า/หมวดที่มีรีวิว + คำตอบเก่าไว้แนะนำ
//   /admin/aspects (+ reorder · :id/restore) · /admin/semantic-terms — หน้าตั้งค่า
// ─────────────────────────────────────────────────────────────
import { http, LIST_ALL } from "@/lib/http";
import type { ItemResponse, ListMeta } from "@/types/api";
import type {
  Review, ReviewAspect, ReviewAspectInput, ReviewFilterOptions, ReviewListParams, ReviewModeration, ReviewSummary,
  SemanticTerm, SemanticTermInput, SentimentResult,
} from "@/types/review";

/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = "/admin/reviews";

function normalizeScore(raw: any): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "object" && "$numberDecimal" in raw) return Number(raw.$numberDecimal);
  return Number(raw) || 0;
}

const toAspect = (a: any): ReviewAspect => ({
  _id: String(a._id),
  aspect_name_th: a.aspect_name_th ?? "",
  aspect_name_eng: a.aspect_name_eng ?? "",
  is_active: a.is_active !== false,
  display_order: Number(a.display_order) || 0,
  icon: a.icon ?? null,
  placeholder_text: a.placeholder_text ?? null,
  deleted_at: a.deleted_at ?? null,
});

const toTerm = (t: any): SemanticTerm => ({
  _id: String(t._id),
  term: t.term ?? "",
  synonyms: t.synonyms ?? [],
  aspect: t.aspect_id && typeof t.aspect_id === "object" ? { _id: String(t.aspect_id._id), aspect_name_th: t.aspect_id.aspect_name_th ?? "" } : null,
});

export const reviewsService = {
  /** ส่ง summary=1 เสมอ — getList ทั่วไปทิ้ง data.summary (I9) จึงแกะเอง */
  list: async (params: ReviewListParams = {}): Promise<{ data: Review[]; meta: ListMeta; summary: ReviewSummary | null }> => {
    const res = await http.get<ItemResponse<{ items?: Review[]; meta?: ListMeta; summary?: ReviewSummary }>>(BASE, {
      params: { ...params, summary: 1 },
    });
    const items = res.data?.items ?? [];
    return {
      data: items,
      meta: res.data?.meta ?? { page: 1, limit: items.length, total: items.length },
      summary: res.data?.summary ?? null,
    };
  },
  moderate: async (id: string, body: ReviewModeration): Promise<Review> => (await http.patch<ItemResponse<Review>>(`${BASE}/${id}`, body)).data,
  remove: (id: string) => http.delete(`${BASE}/${id}`),
  bulkRead: async (ids: string[], read: boolean): Promise<{ matched: number; modified: number }> =>
    (await http.post<ItemResponse<{ matched: number; modified: number }>>(`${BASE}/bulk`, { ids, action: read ? "mark_read" : "mark_unread" })).data,
  filterOptions: async (): Promise<ReviewFilterOptions> => (await http.get<ItemResponse<ReviewFilterOptions>>(`${BASE}/filter-options`)).data,

  /** ผลวิเคราะห์ sentiment รายรีวิว — มีเฉพาะรีวิวที่ is_analyzed แล้ว */
  sentiment: async (id: string): Promise<SentimentResult[]> => {
    const res = await http.get<{ data: { review_id: string; results: any[] } }>(`${BASE}/${id}/sentiment`);
    return res.data.results.map((r) => ({ ...r, sentiment_score: normalizeScore(r.sentiment_score) }));
  },
};

/** แง่มุมรีวิว — list ของ backend เรียงตามชื่อ (ไม่รองรับ display_order) → เรียงเองตามลำดับในฟอร์ม */
export const reviewAspectsService = {
  /** ทั้งที่ใช้อยู่และที่ลบแล้ว (deleted_at ≠ null) */
  list: async (): Promise<ReviewAspect[]> =>
    (await http.getList<any>("/admin/aspects", { params: { limit: LIST_ALL, includeDeleted: true } })).data
      .map(toAspect)
      .sort((a, b) => a.display_order - b.display_order || a.aspect_name_th.localeCompare(b.aspect_name_th, "th")),
  create: async (body: ReviewAspectInput): Promise<ReviewAspect> => toAspect((await http.post<ItemResponse<any>>("/admin/aspects", body)).data),
  update: async (id: string, body: ReviewAspectInput): Promise<ReviewAspect> =>
    toAspect((await http.patch<ItemResponse<any>>(`/admin/aspects/${id}`, body)).data),
  remove: (id: string) => http.delete(`/admin/aspects/${id}`),
  restore: async (id: string): Promise<ReviewAspect> => toAspect((await http.post<ItemResponse<any>>(`/admin/aspects/${id}/restore`)).data),
  /** ลำดับใหม่ทั้งชุด → แง่มุมที่ใช้อยู่ตามลำดับใหม่ (backend ตอบแบบ list: data.items) */
  reorder: async (orderedIds: string[]): Promise<ReviewAspect[]> =>
    ((await http.patch<ItemResponse<{ items?: any[] }>>("/admin/aspects/reorder", { orderedIds })).data?.items ?? []).map(toAspect),
};

export const semanticTermsService = {
  list: async (): Promise<SemanticTerm[]> =>
    (await http.getList<any>("/admin/semantic-terms", { params: { limit: LIST_ALL, sortBy: "term", sortOrder: "asc" } })).data.map(toTerm),
  create: async (body: SemanticTermInput): Promise<SemanticTerm> => toTerm((await http.post<ItemResponse<any>>("/admin/semantic-terms", body)).data),
  update: async (id: string, body: SemanticTermInput): Promise<SemanticTerm> =>
    toTerm((await http.patch<ItemResponse<any>>(`/admin/semantic-terms/${id}`, body)).data),
  remove: (id: string) => http.delete(`/admin/semantic-terms/${id}`),
};
