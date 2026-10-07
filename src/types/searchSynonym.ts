// ─────────────────────────────────────────────────────────────
// src/types/searchSynonym.ts — กลุ่มคำพ้องค้นหา (backend searchSynonymModel · /admin/search-synonyms · BACKLOG4 E3)
// 1 กลุ่ม = คำหลัก + คำพ้อง (ไทย/อังกฤษ/ชื่อเล่น/คำที่มักพิมพ์ผิด) — ลูกค้าค้นด้วยคำไหนในกลุ่มก็เจอสินค้าของทุกคำ
// ─────────────────────────────────────────────────────────────
export interface SearchSynonym {
  _id: string;
  term: string;
  synonyms: string[];
}

export interface SearchSynonymInput {
  term: string;
  synonyms: string[];
}
