// ─────────────────────────────────────────────────────────────
// src/theme/palette.ts
// สีดิบ (primitive) ของโปรเจกต์ — ชั้นล่างสุดของ theme system
//
// ★ SINGLE SOURCE OF TRUTH ของ "ค่าสี" ฝั่ง JS/TS (antd, sweetalert, inline style)
//   ฝั่ง CSS ใช้ค่าชุดเดียวกันผ่าน --color-* ใน src/app/globals.css (@theme)
//   ห้ามแก้ที่เดียว — มี `npm run lint:theme` (scripts/check-theme.mjs) เช็คว่าตรงกัน
//
// ใช้ token เชิงความหมายจาก ./tokens.ts เสมอ (color.brandPrimary ฯลฯ) — อย่า import ไฟล์นี้ตรงในหน้า
// ─────────────────────────────────────────────────────────────

/** สเกลสีแบรนด์ "Coffee" (น้ำตาล) — จุดยึดหลัก = 800 (ปุ่ม primary, หัวข้อ, เมนู active) */
export const brand = {
  50: "#FAF5F2",
  100: "#F1E4DC",
  200: "#E3C9B8",
  300: "#D0A688",
  400: "#B87F5C",
  500: "#9C6644",
  600: "#7C4F35",
  700: "#603D2A",
  800: "#4B2E2B",
  900: "#37201D",
  950: "#241512",
} as const;

/** สีกลาง (เทา) เท่าที่ใช้จริงนอกสเกลของ Tailwind — คุมคอนทราสต์ให้ผ่าน WCAG AA บนพื้นขาว */
export const neutral = {
  /** ข้อความหลัก — เข้มกว่า brand-800 เล็กน้อย */
  ink: "#3D2523",
  /** ข้อความรอง (label, คำอธิบาย) — gray-600, คอนทราสต์ ≥ 4.5:1 */
  muted: "#4B5563",
  /** ข้อความลำดับสาม (timestamp, hint) — gray-500, ใช้กับข้อความสั้นเท่านั้น */
  subtle: "#64748B",
  /** เส้นขอบมาตรฐาน — เทาอุ่นให้เข้ากับแบรนด์กาแฟ (เดิม slate #E2E8F0) */
  border: "#E4DAD1",
  /** เส้นแบ่งบาง / พื้นหลัง hover อ่อน (เดิม #F1F5F9) */
  borderSubtle: "#F0E9E2",
  /** พื้นหลังพื้นที่เนื้อหา — warm off-white (เดิม #F8FAFC) */
  bgApp: "#F4F0EB",
  /** พื้นการ์ด / แผง */
  surface: "#FFFFFF",
} as const;

/** สีสถานะ (feedback) — ป้อนให้ antd colorError/Warning/Success/Info และ utility --color-danger ฯลฯ */
export const status = {
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#2563EB",
} as const;

export type BrandScale = typeof brand;
export type BrandStep = keyof BrandScale;
