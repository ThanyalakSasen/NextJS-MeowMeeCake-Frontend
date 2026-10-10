#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// scripts/check-ui.mjs
// กฎ UI ที่เขียนไว้ใน docs แต่เดิมไม่มีใครตรวจ — คนเลยลืมได้เรื่อย ๆ
// (ที่มา: docs/CONSISTENCY_AUDIT.md §4 Phase 1 — "กฎที่ไม่มีเครื่องตรวจ = กฎที่จะถูกลืม")
//
// กฎที่ตรวจ:
//   no-gray-400        ห้าม text-gray-400 (คอนทราสต์ไม่ผ่าน WCAG AA)      docs/THEME.md §4
//   plus-icon-solid    PlusIcon ต้องมาจาก 24/solid เสมอ                   docs/ACTION_BUTTONS.md §1.1
//   icon-button-aria   ปุ่มที่มีแต่ไอคอน ต้องมี aria-label                docs/ACTION_BUTTONS.md §4.1
//   tag-color-enum     <Tag color=...> ห้ามใส่ชื่อสีของ antd ตรง ๆ        docs/THEME.md §2
//
// ── ทำงานแบบ ratchet (เฟืองกันถอย) ───────────────────────────
// ของเดิมยังมีค้างอยู่เยอะ (ดู CONSISTENCY_AUDIT ข้อ 3.4-3.8) จะรอแก้ครบก่อนเปิดกฎไม่ไหว
// สคริปต์จึงเทียบกับ "จำนวนที่ยอมรับได้" ต่อไฟล์ใน scripts/ui-baseline.json แทน:
//   มากกว่า baseline  → ✗ ไม่ผ่าน (เพิ่มของใหม่เข้ามา — ห้าม)
//   เท่ากับ baseline  → ผ่าน (ของเดิม รอ Phase 3/3B มาเก็บ)
//   น้อยกว่า baseline → ผ่าน + เตือนให้รัน --update (ขันเฟืองให้แน่นขึ้น)
//   ไฟล์ที่ไม่มีใน baseline → ✗ ไม่ผ่านทันที (ไฟล์ใหม่ต้องสะอาดตั้งแต่แรก)
//
//   node scripts/check-ui.mjs           → รายงานอย่างเดียว (exit 0)
//   node scripts/check-ui.mjs --strict  → exit 1 ถ้าเกิน baseline (ใช้ใน npm run check)
//   node scripts/check-ui.mjs --update  → เขียน baseline ใหม่จากสถานะปัจจุบัน
// ─────────────────────────────────────────────────────────────
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const BASELINE_PATH = join(ROOT, "scripts/ui-baseline.json");
const STRICT = process.argv.includes("--strict");
const UPDATE = process.argv.includes("--update");

// ── รวมไฟล์ที่ต้องตรวจ ──
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}
const files = walk(SRC).map((p) => ({ abs: p, rel: relative(ROOT, p).replace(/\\/g, "/") }));

// ── helper: หา ">" ที่ปิดแท็กเปิด โดยข้าม {...} และ "..." ที่ซ้อนอยู่ ──
// (regex ธรรมดาใช้ไม่ได้ — <Button icon={<X />}> จะไปจบที่ /> ของไอคอนข้างใน)
function endOfTag(src, i) {
  let depth = 0;
  let quote = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote && src[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}

/**
 * อ่านค่าของ attribute หนึ่งตัวจากข้อความแท็กเปิด
 * คืน { kind: "string", value } สำหรับ foo="bar" (value ถอด quote แล้ว)
 *     { kind: "expr",   value } สำหรับ foo={...}  (value รวมปีกกา)
 *     undefined ถ้าไม่มี attribute นี้
 */
function attrValue(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}=`));
  if (!m) return undefined;
  const start = m.index + m[0].length;
  if (tag[start] === '"' || tag[start] === "'") {
    const q = tag[start];
    const end = tag.indexOf(q, start + 1);
    return { kind: "string", value: tag.slice(start + 1, end) };
  }
  if (tag[start] === "{") {
    let depth = 0;
    for (let i = start; i < tag.length; i++) {
      if (tag[i] === "{") depth++;
      else if (tag[i] === "}" && --depth === 0) return { kind: "expr", value: tag.slice(start, i + 1) };
    }
  }
  return undefined;
}

const lineOf = (src, idx) => src.slice(0, idx).split("\n").length;

// ── กฎ ──
// สีสำเร็จรูปของ antd — ถ้าโผล่เป็น string ใน color= แปลว่า hardcode (ควรมาจาก enumConfig)
const ANT_COLORS = new Set([
  "success", "processing", "error", "warning", "default",
  "magenta", "red", "volcano", "orange", "gold", "lime",
  "green", "cyan", "blue", "geekblue", "purple",
]);

const RULES = {
  "no-gray-400": {
    doc: "docs/THEME.md §4 — gray-400 ได้คอนทราสต์ 2.54:1 ตก WCAG AA · ข้อความรองใช้ gray-500 ขึ้นไป",
    scan(src) {
      const hits = [];
      // จับทั้ง text-gray-400 และ placeholder-gray-400 (syntax Tailwind v3 ที่ v4 ไม่รองรับแล้ว
      // — เคยหลุดรอดมาได้เพราะกฎเดิมดักแค่ "text-")
      for (const m of src.matchAll(/(?:text|placeholder)-gray-400|placeholder:text-gray-400/g))
        hits.push({ line: lineOf(src, m.index), text: m[0] });
      return hits;
    },
  },

  "plus-icon-solid": {
    doc: 'docs/ACTION_BUTTONS.md §1.1 — ไอคอน add ต้องเป็น solid เสมอ · ใช้ actionIcon("add") แทนการ import เอง',
    scan(src) {
      const hits = [];
      for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"@heroicons\/react\/24\/outline"/g)) {
        if (/\bPlusIcon\b/.test(m[1])) hits.push({ line: lineOf(src, m.index), text: "PlusIcon จาก 24/outline" });
      }
      return hits;
    },
  },

  "icon-button-aria": {
    doc: "docs/ACTION_BUTTONS.md §4.1 — ปุ่มที่มีแต่ไอคอน screen reader อ่านไม่ออกถ้าไม่มี aria-label",
    scan(src) {
      const hits = [];
      for (const m of src.matchAll(/<Button\b/g)) {
        const end = endOfTag(src, m.index);
        if (end < 0) continue;
        const tag = src.slice(m.index, end + 1);
        if (src[end - 1] !== "/") continue;        // มี children = มีคำกำกับอยู่แล้ว
        if (!/\bicon=/.test(tag)) continue;        // ไม่มีไอคอน = ไม่เกี่ยว
        if (/\baria-label[=\s]/.test(tag)) continue;
        hits.push({ line: lineOf(src, m.index), text: "ปุ่มไอคอนล้วนไม่มี aria-label" });
      }
      return hits;
    },
  },

  "tag-color-enum": {
    doc: "docs/THEME.md §2 — สีของป้ายสถานะต้องมาจาก src/constants/enumConfig.ts (cfg.antColor)",
    scan(src) {
      const hits = [];
      for (const m of src.matchAll(/<Tag\b/g)) {
        const end = endOfTag(src, m.index);
        if (end < 0) continue;
        const attr = attrValue(src.slice(m.index, end + 1), "color");
        if (attr === undefined) continue;
        // ชื่อสีของ antd ที่เขียนลงไปตรง ๆ — ทั้ง color="gold" และ color={x ? "gold" : "blue"}
        // ส่วน color={cfg.antColor} / color={ZONE_COLOR[k]} ไม่มี string จึงไม่ติด (ดูหมายเหตุใต้กฎ)
        const names =
          attr.kind === "string"
            ? ANT_COLORS.has(attr.value) ? [attr.value] : []
            : [...attr.value.matchAll(/["']([a-z]+)["']/g)].map((q) => q[1]).filter((n) => ANT_COLORS.has(n));
        if (names.length) hits.push({ line: lineOf(src, m.index), text: `<Tag color> hardcode: ${[...new Set(names)].join(", ")}` });
      }
      return hits;
    },
  },

  // ⏳ เปิดใช้หลัง Phase 3B (ยุบบล็อก error/retry เป็น QueryState) — ดู CONSISTENCY_AUDIT ข้อ 3.14 A1
  // "query-state-only": {
  //   doc: "docs/CONSISTENCY_AUDIT.md ข้อ 3.14 A1 — ใช้ <QueryState> แทนการเขียนบล็อก error/retry เอง",
  //   scan(src) { ... common.loadFailed นอก QueryState.tsx ... },
  // },
};

// ── สแกน ──
/** { rule: { relPath: [hit, ...] } } */
const found = {};
for (const key of Object.keys(RULES)) found[key] = {};
for (const f of files) {
  const src = readFileSync(f.abs, "utf8");
  for (const [key, rule] of Object.entries(RULES)) {
    const hits = rule.scan(src);
    if (hits.length) found[key][f.rel] = hits;
  }
}

// ── โหมดเขียน baseline ──
if (UPDATE) {
  const next = {};
  for (const [key, byFile] of Object.entries(found)) {
    next[key] = Object.fromEntries(
      Object.entries(byFile)
        .map(([rel, hits]) => [rel, hits.length])
        .sort(([a], [b]) => a.localeCompare(b)),
    );
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
  const total = Object.values(next).reduce((s, m) => s + Object.values(m).reduce((a, b) => a + b, 0), 0);
  console.log(`✓ ui: เขียน baseline ใหม่แล้ว (${total} จุด ใน ${Object.keys(next).length} กฎ) → scripts/ui-baseline.json`);
  process.exit(0);
}

// ── เทียบกับ baseline ──
const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")) : {};

let failed = false;
let loosened = 0;

for (const [key, rule] of Object.entries(RULES)) {
  const base = baseline[key] ?? {};
  const byFile = found[key];
  const over = [];   // เกิน baseline = ของใหม่
  const under = [];  // ต่ำกว่า baseline = แก้ไปแล้ว ควรขันเฟือง

  for (const [rel, hits] of Object.entries(byFile)) {
    const allowed = base[rel] ?? 0;
    if (hits.length > allowed) over.push({ rel, hits, allowed });
  }
  for (const [rel, allowed] of Object.entries(base)) {
    const now = byFile[rel]?.length ?? 0;
    if (now < allowed) under.push({ rel, now, allowed });
  }

  const remaining = Object.values(byFile).reduce((s, h) => s + h.length, 0);

  if (over.length) {
    failed = true;
    console.log(`✗ ui/${key}: พบของใหม่ที่ผิดกฎ — ${rule.doc}`);
    for (const o of over) {
      const label = o.allowed === 0 ? "ไฟล์นี้ยังไม่เคยมีข้อยกเว้น" : `baseline ยอมให้ ${o.allowed}`;
      console.log(`  ${o.rel}  พบ ${o.hits.length} (${label})`);
      for (const h of o.hits.slice(0, 5)) console.log(`      บรรทัด ${h.line}: ${h.text}`);
      if (o.hits.length > 5) console.log(`      … อีก ${o.hits.length - 5} จุด`);
    }
  } else {
    const note = remaining ? ` (ยังค้าง ${remaining} จุดเดิม — รอ Phase 3/3B)` : "";
    console.log(`✓ ui/${key}: ไม่มีของใหม่ผิดกฎ${note}`);
  }

  if (under.length) {
    loosened += under.length;
    for (const u of under) console.log(`  ↓ ${u.rel}  เหลือ ${u.now} จาก ${u.allowed} — ดีขึ้นแล้ว`);
  }
}

if (loosened) {
  console.log(`\n⚙ ui: มี ${loosened} ไฟล์ที่แก้ไปแล้ว — รัน \`npm run lint:ui:update\` เพื่อขันเฟืองไม่ให้ถอยกลับ`);
}

process.exit(failed && STRICT ? 1 : 0);
