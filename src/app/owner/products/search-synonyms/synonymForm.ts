// ─────────────────────────────────────────────────────────────
// ฟอร์มกลุ่มคำพ้อง (BACKLOG4 E3) — ทำความสะอาด + ตรวจแบบเดียวกับ backend searchSynonymService.parseBody
// + หาคำที่ซ้ำกับกลุ่มอื่น (เตือน ไม่บล็อก — ค้นคำนั้นจะได้สินค้าของทั้งสองกลุ่ม)
// error คืนเป็น key ใต้ searchSynonyms.errors.* (+ ค่าแทรก)
// ─────────────────────────────────────────────────────────────
import { normalizeText } from "@/lib/searchSynonyms";
import type { SearchSynonym, SearchSynonymInput } from "@/types/searchSynonym";

export const MIN_WORD_LENGTH = 2;
export const MAX_WORD_LENGTH = 60;
export const MAX_SYNONYMS = 50;

export const EMPTY_SYNONYM_FORM: SearchSynonymInput = { term: "", synonyms: [] };

/** ตัดช่องว่าง · ตัดค่าว่าง · ตัดคำซ้ำ (เทียบแบบ normalize) และคำที่ซ้ำกับคำหลัก — เหมือนที่ backend เก็บจริง */
export function cleanSynonymInput(f: SearchSynonymInput): SearchSynonymInput {
  const term = f.term.trim();
  const seen = new Set([normalizeText(term)]);
  const synonyms: string[] = [];
  for (const s of f.synonyms) {
    const v = s.trim();
    const key = normalizeText(v);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    synonyms.push(v);
  }
  return { term, synonyms };
}

export interface SynonymError {
  key: string;
  values?: Record<string, string | number>;
}

/** ตรวจก่อนส่ง — คืนปัญหาแรก หรือ null */
export function validateSynonym(f: SearchSynonymInput, groups: SearchSynonym[], editingId?: string): SynonymError | null {
  const c = cleanSynonymInput(f);
  if (normalizeText(c.term).length < MIN_WORD_LENGTH) return { key: "termTooShort", values: { min: MIN_WORD_LENGTH } };
  if (c.term.length > MAX_WORD_LENGTH) return { key: "termTooLong", values: { max: MAX_WORD_LENGTH } };
  const termKey = normalizeText(c.term);
  const dup = groups.find((g) => g._id !== editingId && normalizeText(g.term) === termKey);
  if (dup) return { key: "termDuplicate", values: { term: dup.term } };
  const short = c.synonyms.find((s) => normalizeText(s).length < MIN_WORD_LENGTH);
  if (short) return { key: "synonymTooShort", values: { word: short, min: MIN_WORD_LENGTH } };
  const long = c.synonyms.find((s) => s.length > MAX_WORD_LENGTH);
  if (long) return { key: "synonymTooLong", values: { max: MAX_WORD_LENGTH } };
  if (c.synonyms.length > MAX_SYNONYMS) return { key: "tooManySynonyms", values: { max: MAX_SYNONYMS } };
  return null;
}

/** คำในฟอร์มที่มีอยู่แล้วในกลุ่มอื่น → [{ word, group }] (ไม่นับกลุ่มที่กำลังแก้) */
export function findClashes(f: SearchSynonymInput, groups: SearchSynonym[], editingId?: string): { word: string; group: string }[] {
  const owners = new Map<string, string>();
  for (const g of groups) {
    if (g._id === editingId) continue;
    for (const w of [g.term, ...g.synonyms]) owners.set(normalizeText(w), g.term);
  }
  return [f.term, ...f.synonyms]
    .filter((w) => w.trim())
    .flatMap((word) => {
      const group = owners.get(normalizeText(word));
      return group ? [{ word: word.trim(), group }] : [];
    });
}

/** ค้นในรายการกลุ่ม (คำหลักหรือคำพ้องมีคำนี้ — ไม่สนตัวพิมพ์/วรรณยุกต์) */
export function filterGroups(groups: SearchSynonym[], search: string): SearchSynonym[] {
  const q = normalizeText(search);
  if (!q) return groups;
  return groups.filter((g) => [g.term, ...g.synonyms].some((w) => normalizeText(w).includes(q)));
}
