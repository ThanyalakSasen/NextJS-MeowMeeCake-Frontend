#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// scripts/check-i18n.mjs
// หา string literal ที่มีอักษรไทย (ช่วง U+0E00–U+0E7F) ใน src/**/*.{ts,tsx}
// ที่ "ไม่ได้อยู่ใน" ไดเรกทอรีที่อนุญาต — เตือนว่าควรย้ายไป src/i18n/messages
//
//   node scripts/check-i18n.mjs           → รายงานอย่างเดียว (exit 0)
//   node scripts/check-i18n.mjs --strict  → exit 1 ถ้าเจอ (ใช้ใน CI ตั้งแต่เฟส 3)
// ─────────────────────────────────────────────────────────────
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const STRICT = process.argv.includes("--strict");

// ไดเรกทอรี/ไฟล์ที่ยกเว้น (มีอักษรไทยได้โดยตั้งใจ)
const ALLOW_DIRS = [
  "src/i18n",           // ตัว catalog เอง
  "src/types",          // interface/union ที่มีค่าไทยเป็น literal type (แนวทาง A)
  "src/constants",      // *_CONFIG ที่ key ด้วยค่า DB enum ภาษาไทย (แนวทาง A) · รายชื่อจังหวัด
  // หน้าร้าน (src/app/customer · src/components/customer) ย้ายเข้า shop.* ครบแล้ว 2026-10-09 — ไม่ยกเว้นอีก
];
const ALLOW_FILES = [
  "src/app/layout.tsx", // metadata.description — จะย้ายไป generateMetadata ทีหลัง
  "src/app/customer/lib/storeFormat.ts", // รูปแบบที่อยู่ไทย (ต./อ./จ. · แขวง/เขต) — รูปแบบข้อมูล ไม่ใช่ข้อความ UI
  "src/app/owner/orders/delivery-zones/deliveryZoneForm.ts", // regex ตัดคำนำหน้าจังหวัด (สำเนากติกา backend)
  "src/lib/searchSynonyms.ts", // regex ตัดวรรณยุกต์ตอนเทียบคำค้น (สำเนากติกา backend)
];

// อักษรไทย ยกเว้น ฿ (U+0E3F — สัญลักษณ์สกุลเงิน ใช้ได้ทุกภาษา)
const THAI = /[฀-฾เ-๿]/;
// จับเฉพาะ string / template literal (หยาบ ๆ แต่พอสำหรับ warn)
const STRING_LITERAL = /(["'`])(?:\\.|(?!\1)[^\\])*\1/g;

/** ตัด comment ออกโดยคงบรรทัดไว้ (เลขบรรทัดในรายงานตรงกับไฟล์) */
function stripComments(code) {
  const keepLines = (m) => m.replace(/[^\n]/g, " ");
  return code
    .replace(/\/\*[\s\S]*?\*\//g, keepLines) // block (รวม {/* */} ใน JSX)
    .replace(/(^|[^:])\/\/.*$/gm, "$1"); // line (เลี่ยง http://)
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(name)) yield full;
  }
}

const hits = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  if (ALLOW_DIRS.some((d) => rel.startsWith(d + "/")) || ALLOW_FILES.includes(rel)) continue;

  const lines = stripComments(readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(STRING_LITERAL)) {
      if (THAI.test(m[0])) hits.push({ rel, line: i + 1, text: m[0].slice(0, 80) });
    }
    // ข้อความใน JSX (<p>ข้อความ</p>) ไม่ใช่ string literal — เหลืออักษรไทยหลังตัด literal ออก = ข้อความตรงในโค้ด
    const rest = line.replace(STRING_LITERAL, "");
    if (THAI.test(rest)) hits.push({ rel, line: i + 1, text: `(JSX) ${rest.trim().slice(0, 74)}` });
  });
}

// ── 2. เช็คว่า th.json กับ en.json มี key เหมือนกัน (กันลืมอัปเดตอีกไฟล์) ──
function flatKeys(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...flatKeys(v, key));
    else out.push(key);
  }
  return out;
}

const th = JSON.parse(readFileSync(join(SRC, "i18n/messages/th.json"), "utf8"));
const en = JSON.parse(readFileSync(join(SRC, "i18n/messages/en.json"), "utf8"));
const thKeys = new Set(flatKeys(th));
const enKeys = new Set(flatKeys(en));
const missingInEn = [...thKeys].filter((k) => !enKeys.has(k));
const missingInTh = [...enKeys].filter((k) => !thKeys.has(k));

// ── สรุปผล ──
let failed = false;

if (hits.length === 0) {
  console.log("✓ i18n: ไม่พบ literal อักษรไทยนอก catalog");
} else {
  failed = true;
  console.log(`✗ i18n: พบ literal อักษรไทย ${hits.length} จุด — ย้ายไป src/i18n/messages แล้วใช้ t()`);
  for (const h of hits) console.log(`  ${h.rel}:${h.line}  ${h.text}`);
}

if (missingInEn.length === 0 && missingInTh.length === 0) {
  console.log("✓ i18n: key ของ th.json / en.json ตรงกันครบ");
} else {
  failed = true;
  if (missingInEn.length) console.log(`✗ i18n: มีใน th.json แต่ไม่มีใน en.json (${missingInEn.length}): ${missingInEn.join(", ")}`);
  if (missingInTh.length) console.log(`✗ i18n: มีใน en.json แต่ไม่มีใน th.json (${missingInTh.length}): ${missingInTh.join(", ")}`);
}

process.exit(failed && STRICT ? 1 : 0);
