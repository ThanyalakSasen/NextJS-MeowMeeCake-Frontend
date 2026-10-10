#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// scripts/check-theme.mjs
// theme system มีค่าสี "สองที่" ที่ต้องตรงกัน:
//   1. src/theme/palette.ts   → ฝั่ง JS/antd
//   2. src/app/globals.css    → ฝั่ง Tailwind (@theme --color-*)
// สคริปต์นี้ parse ทั้งสองไฟล์แล้วเทียบ hex ทีละคีย์
//
// และตรวจ "ขนาดตัวอักษร" ด้วย — globals.css เขียนเป็น rem แต่คนอ่านจากคอมเมนต์ /* Npx */
// ถ้าคอมเมนต์คิดจากฐาน 16px (ค่า default ของเบราว์เซอร์) แต่โปรเจกต์ใช้ฐาน 18px เลขจะผิดทันที
// เคยเกิดมาแล้วจริง: --menu-item-font-size เขียน "17px" แต่ค่าจริงคือ 19.125px
// เมนูจึงใหญ่กว่าเนื้อหาหลักมาตลอดโดยไม่มีใครรู้ — กฎนี้กันไม่ให้เกิดซ้ำ
//
//   node scripts/check-theme.mjs           → รายงานอย่างเดียว (exit 0)
//   node scripts/check-theme.mjs --strict  → exit 1 ถ้าไม่ตรง (ใช้ใน CI / npm run lint)
// ─────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const STRICT = process.argv.includes("--strict");

const paletteSrc = readFileSync(join(ROOT, "src/theme/palette.ts"), "utf8");
const cssSrc = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

const norm = (hex) => hex.trim().toLowerCase();

// ── 1. palette.ts ──
// จับบล็อก `export const <name> = { ... } as const;`
function tsBlock(name) {
  const m = paletteSrc.match(new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\}`));
  return m ? m[1] : "";
}
function tsPairs(name, keyRe) {
  const out = {};
  for (const m of tsBlock(name).matchAll(keyRe)) out[m[1]] = norm(m[2]);
  return out;
}
const brandTs = tsPairs("brand", /(\d+):\s*"(#[0-9a-fA-F]{3,8})"/g);
const statusTs = tsPairs("status", /(\w+):\s*"(#[0-9a-fA-F]{3,8})"/g);

// ── 2. globals.css ──
function cssVars(prefix, keys) {
  const out = {};
  for (const k of keys) {
    const m = cssSrc.match(new RegExp(`--color-${prefix}${k}:\\s*(#[0-9a-fA-F]{3,8})`));
    if (m) out[k] = norm(m[1]);
  }
  return out;
}
const brandCss = cssVars("brown-", Object.keys(brandTs));
const statusCss = cssVars("", Object.keys(statusTs));

// ── เทียบ ──
let failed = false;
function compare(label, ts, css, cssKeyName) {
  const rows = [];
  for (const [k, v] of Object.entries(ts)) {
    if (css[k] === undefined) rows.push(`  ${label}.${k}  ไม่พบ ${cssKeyName(k)} ใน globals.css`);
    else if (css[k] !== v) rows.push(`  ${label}.${k}  palette=${v}  css=${css[k]}  ← ไม่ตรง`);
  }
  if (rows.length) {
    failed = true;
    console.log(`✗ theme: ${label} ไม่ซิงก์กับ globals.css`);
    rows.forEach((r) => console.log(r));
  } else {
    console.log(`✓ theme: ${label} (${Object.keys(ts).length} ค่า) ตรงกับ globals.css`);
  }
}

if (Object.keys(brandTs).length !== 11) {
  failed = true;
  console.log(`✗ theme: อ่าน brand จาก palette.ts ได้ ${Object.keys(brandTs).length} ค่า (คาดหวัง 11)`);
}
compare("brand", brandTs, brandCss, (k) => `--color-brown-${k}`);
compare("status", statusTs, statusCss, (k) => `--color-${k}`);

// ── 3. ขนาดตัวอักษร: rem ใน globals.css ต้องตรงกับ px ที่คอมเมนต์อ้าง ──
const tokensSrc = readFileSync(join(ROOT, "src/theme/tokens.ts"), "utf8");
const baseM = tokensSrc.match(/baseSizePx:\s*(\d+)/);
const basePx = baseM ? Number(baseM[1]) : null;

// html { font-size: P% } ต้องให้ 16 × P/100 = baseSizePx
const htmlM = cssSrc.match(/font-size:\s*([\d.]+)%/);
if (basePx === null) {
  failed = true;
  console.log("✗ theme: อ่าน typography.baseSizePx จาก tokens.ts ไม่ได้");
} else if (!htmlM) {
  failed = true;
  console.log("✗ theme: หา html { font-size: N% } ใน globals.css ไม่เจอ");
} else {
  const fromCss = 16 * (Number(htmlM[1]) / 100);
  if (Math.abs(fromCss - basePx) > 0.01) {
    failed = true;
    console.log(`✗ theme: ฐานตัวอักษรไม่ตรง — tokens.baseSizePx=${basePx}px แต่ globals.css html{font-size:${htmlM[1]}%} = ${fromCss}px`);
  } else {
    console.log(`✓ theme: ฐานตัวอักษร ${basePx}px ตรงกันทั้ง tokens.ts และ globals.css`);
  }
}

// ทุกบรรทัดที่เขียน `<X>rem;` แล้วมีคอมเมนต์อ้าง px — เอาเลข px ตัวแรกเป็นคำสัญญา
if (basePx !== null) {
  const bad = [];
  let checked = 0;
  cssSrc.split("\n").forEach((line, i) => {
    const m = line.match(/([\d.]+)rem;\s*\/\*\s*~?\s*([\d.]+)px/);
    if (!m) return;
    checked++;
    const actual = Number(m[1]) * basePx;
    const claimed = Number(m[2]);
    if (Math.abs(actual - claimed) > 0.5)
      bad.push(`  บรรทัด ${i + 1}: ${m[1]}rem = ${Math.round(actual * 1000) / 1000}px แต่คอมเมนต์เขียน ${claimed}px`);
  });
  if (bad.length) {
    failed = true;
    console.log(`✗ theme: คอมเมนต์ px ใน globals.css ไม่ตรงกับ rem จริง (ฐาน ${basePx}px)`);
    bad.forEach((b) => console.log(b));
  } else {
    console.log(`✓ theme: คอมเมนต์ px ใน globals.css (${checked} จุด) ตรงกับ rem จริง`);
  }
}

// พื้นที่กดขั้นต่ำ — ค่าเดียวกันอยู่สองที่ (a11y.touchTargetPx / --touch-target)
// เป็น px ทั้งคู่ การตรวจ rem↔คอมเมนต์ข้างบนจึงไม่ครอบ — ต้องเทียบตรง ๆ
const ttTs = tokensSrc.match(/touchTargetPx:\s*(\d+)/);
const ttCss = cssSrc.match(/--touch-target:\s*(\d+)px/);
if (!ttTs || !ttCss) {
  failed = true;
  console.log(`✗ theme: อ่าน touch target ไม่ครบ (tokens.ts=${!!ttTs} globals.css=${!!ttCss}) — --touch-target ต้องเป็น px ไม่ใช่ rem`);
} else if (ttTs[1] !== ttCss[1]) {
  failed = true;
  console.log(`✗ theme: touch target ไม่ตรง — tokens.ts=${ttTs[1]}px  globals.css=${ttCss[1]}px`);
} else {
  console.log(`✓ theme: touch target ${ttTs[1]}px ตรงกันทั้งสองไฟล์`);
}

process.exit(failed && STRICT ? 1 : 0);
