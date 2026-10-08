// ─────────────────────────────────────────────────────────────
// src/lib/parseCoordinates.ts — อ่านพิกัด (ละติจูด, ลองจิจูด) จากข้อความที่ร้านกรอก (BACKLOG4 E2)
// สำเนาของ backend src/lib/parseCoordinates.ts (ตัวแปลงลิงก์ย่อฝั่ง server ใช้กติกาเดียวกัน) — ต่างกันแค่คืน error เป็นรหัส
// (ข้อความแปลใน i18n storeInfo.coord.*) · รองรับ "17.878, 102.742" · ลิงก์ Google Maps แบบเต็ม
// ลิงก์ย่อ (maps.app.goo.gl) ต้องให้ server แปลง → POST /admin/map-link
// ─────────────────────────────────────────────────────────────
const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";

// รูปแบบพิกัดในลิงก์ Google Maps แบบเต็ม (เรียงจากแม่นที่สุด)
const URL_PATTERNS = [
  new RegExp(`!3d${NUM}!4d${NUM}`), // ตำแหน่งหมุดจริงของสถานที่
  new RegExp(`[?&](?:q|query|ll|destination|center)=${NUM},\\s*${NUM}`),
  new RegExp(`@${NUM},${NUM}`), // กึ่งกลางแผนที่ที่กำลังดูอยู่
];
const PLAIN = new RegExp(`^\\s*${NUM}\\s*[,\\s]\\s*${NUM}\\s*$`);
const SHORT_LINK_RE = /^https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps)\/\S+$/i;

export type CoordinateError = "empty" | "shortLink" | "notFound" | "outOfRange";
export type ParseResult = { ok: true; lat: number; lng: number } | { ok: false; error: CoordinateError };

/** ลิงก์แบบย่อของ Google Maps (ต้องให้ server ตาม redirect ก่อนถึงจะเห็นพิกัด) */
export function isShortMapLink(input: string): boolean {
  return SHORT_LINK_RE.test(input.trim());
}

export function parseCoordinates(input: string): ParseResult {
  let text = input.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    /* มี % ที่ไม่ใช่ URL-encoding — ใช้ข้อความเดิม */
  }
  if (!text) return { ok: false, error: "empty" };
  if (isShortMapLink(text)) return { ok: false, error: "shortLink" };

  const match = PLAIN.exec(text) ?? URL_PATTERNS.map((re) => re.exec(text)).find(Boolean);
  if (!match) return { ok: false, error: "notFound" };
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return { ok: false, error: "outOfRange" };
  return { ok: true, lat, lng };
}
