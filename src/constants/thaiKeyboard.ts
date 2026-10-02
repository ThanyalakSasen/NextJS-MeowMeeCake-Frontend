// ─────────────────────────────────────────────────────────────
// src/constants/thaiKeyboard.ts
// แปลงข้อความที่ "พิมพ์ด้วยแป้นไทย (เกษมณี)" กลับเป็นปุ่มเดียวกันบนแป้นอังกฤษ (QWERTY)
//
// ทำไมต้องมี: เครื่องสแกนบาร์โค้ดจำลองตัวเองเป็นคีย์บอร์ด — มันส่ง "ตำแหน่งปุ่ม" ไม่ใช่ตัวอักษร
// ถ้า Windows ตั้งภาษาไทยอยู่ตอนสแกน "pos-0126264" จะกลายเป็น "ยนหขจๅ/ึ/ึภ" แล้ว backend ตอบ
// "รูปแบบรหัสที่สแกนไม่ถูกต้อง" · อยู่ใน constants/ เพราะเป็นตาราง literal ภาษาไทย (check-i18n ยกเว้นไว้)
// ─────────────────────────────────────────────────────────────

// 2 สตริงแต่ละคู่ยาวเท่ากัน ตำแหน่งตรงกันทีละปุ่ม (แถวเลข → Q → A → Z)
const QWERTY = "1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./";
const KEDMANEE = "ๅ/-ภถุึคตจขชๆไำพะัีรนยบลฃฟหกดเ้่าสวงผปแอิืทมใฝ";
const QWERTY_SHIFT = "!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?";
const KEDMANEE_SHIFT = "+๑๒๓๔ู฿๕๖๗๘๙๐\"ฎฑธํ๊ณฯญฐ,ฅฤฆฏโฌ็๋ษศซ.()ฉฮฺ์?ฒฬฦ";

const THAI_TO_QWERTY = new Map<string, string>();
[
  [KEDMANEE, QWERTY],
  [KEDMANEE_SHIFT, QWERTY_SHIFT],
].forEach(([thai, latin]) => {
  const t = Array.from(thai);
  const l = Array.from(latin);
  t.forEach((ch, i) => THAI_TO_QWERTY.set(ch, l[i]));
});

const HAS_THAI = /[฀-๿]/;

/**
 * ถ้ามีอักษรไทยปนอยู่ = พิมพ์ผ่านแป้นไทย → แปลงทุกตัวกลับเป็นปุ่ม QWERTY
 * (ต้องแปลงทั้งสตริง เพราะแป้นไทยก็ให้ "-" "/" ด้วย แต่มาจากปุ่ม 3 และ 2 — ดูทีละตัวแยกไม่ได้)
 * ไม่มีอักษรไทย = คืนเดิม
 */
export function thaiLayoutToQwerty(text: string): string {
  if (!HAS_THAI.test(text)) return text;
  return Array.from(text, (ch) => THAI_TO_QWERTY.get(ch) ?? ch).join("");
}
