// ─────────────────────────────────────────────────────────────
// src/lib/searchSynonyms.ts — กติกาคำพ้องค้นหา (BACKLOG4 E3) · สำเนาของ backend
//   normalizeText            ← src/lib/search/normalize.ts (lowercase · ตัดวรรณยุกต์/สระบนล่างไทย · รวมช่องว่าง)
//   expandQueryWithSynonyms  ← src/services/searchSynonymService.ts (ใช้จริงใน /catalog/products?search=)
// หลังร้านใช้: เตือนคำซ้ำข้ามกลุ่ม · ตรวจก่อนส่ง · แสดงว่าคำค้นในช่อง "ลองค้นหา" ขยายเป็นคำอะไร (ผลสินค้ามาจาก server เสมอ)
// ─────────────────────────────────────────────────────────────

// U+0E31 (ไม้หันอากาศ) · U+0E34–U+0E3A (สระบน/ล่าง) · U+0E47–U+0E4E (ไม้ไต่คู้ วรรณยุกต์ การันต์ ฯลฯ)
const THAI_MARKS = /[ัิ-ฺ็-๎]/g;

export function normalizeText(input: string | null | undefined): string {
  if (!input) return "";
  return input.toLowerCase().normalize("NFC").replace(THAI_MARKS, "").replace(/\s+/g, " ").trim();
}

export interface SynonymWords {
  term: string;
  synonyms: string[];
}

/** คำพ้องที่สั้นกว่านี้ไม่นำมาจับแบบ "ขึ้นต้นด้วย" (เท่ากับ backend MIN_PREFIX_LENGTH) */
const MIN_PREFIX_LENGTH = 2;
const clean = (s: string) => s.trim().toLowerCase();

/** คำค้นตรงกับคำในกลุ่ม (ตรงตัว / คำค้นมีคำนั้น / คำนั้นขึ้นต้นด้วยคำค้น) → ใช้ทุกคำในกลุ่มนั้นด้วย */
export function expandQueryWithSynonyms(query: string, groups: SynonymWords[]): { words: string[]; groups: string[] } {
  const q = clean(query);
  if (!q) return { words: [], groups: [] };
  const words = new Set<string>([q]);
  const used: string[] = [];
  for (const g of groups) {
    const groupWords = [g.term, ...(g.synonyms ?? [])].map(clean).filter(Boolean);
    const hit = groupWords.some((w) => w === q || q.includes(w) || (q.length >= MIN_PREFIX_LENGTH && w.startsWith(q)));
    if (hit) {
      for (const w of groupWords) words.add(w);
      used.push(g.term);
    }
  }
  return { words: [...words], groups: used };
}
