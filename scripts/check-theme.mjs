#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// scripts/check-theme.mjs
// theme system มีค่าสี "สองที่" ที่ต้องตรงกัน:
//   1. src/theme/palette.ts   → ฝั่ง JS/antd
//   2. src/app/globals.css    → ฝั่ง Tailwind (@theme --color-*)
// สคริปต์นี้ parse ทั้งสองไฟล์แล้วเทียบ hex ทีละคีย์
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

process.exit(failed && STRICT ? 1 : 0);
