// ─────────────────────────────────────────────────────────────
// src/services/searchSynonyms.ts — คำพ้องค้นหา (BACKLOG4 E3) · สิทธิ์เมนู products (view/create/update/delete)
// คำหลักซ้ำ (ไม่สนตัวพิมพ์/วรรณยุกต์) = 409 · คำสั้นกว่า 2 ตัว = 400 · ลบ = soft delete · แก้แล้วการค้นหาหน้าร้านใช้ทันที
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { SearchSynonym, SearchSynonymInput } from "@/types/searchSynonym";

const BASE = "/admin/search-synonyms";

const toSynonym = (raw: SearchSynonym): SearchSynonym => ({ _id: String(raw._id), term: raw.term, synonyms: raw.synonyms ?? [] });

export const searchSynonymsService = {
  /** ไม่แบ่งหน้า — backend คืนทุกกลุ่ม เรียงตามคำหลัก */
  list: async (): Promise<SearchSynonym[]> => (await http.getList<SearchSynonym>(BASE)).data.map(toSynonym),
  create: async (body: SearchSynonymInput): Promise<SearchSynonym> => toSynonym((await http.post<ItemResponse<SearchSynonym>>(BASE, body)).data),
  update: async (id: string, body: SearchSynonymInput): Promise<SearchSynonym> =>
    toSynonym((await http.patch<ItemResponse<SearchSynonym>>(`${BASE}/${id}`, body)).data),
  remove: async (id: string): Promise<void> => {
    await http.delete(`${BASE}/${id}`);
  },
};
