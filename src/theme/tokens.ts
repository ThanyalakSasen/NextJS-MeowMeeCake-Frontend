// ─────────────────────────────────────────────────────────────
// src/theme/tokens.ts
// Token "เชิงความหมาย" — ชั้นที่โค้ดทั่วไปควรใช้ (ไม่ใช่ palette.ts ตรง ๆ)
//
// ใช้ที่ไหน:
//   • src/theme/antdTheme.ts  → แปลงเป็น antd ThemeConfig
//   • src/lib/alert.ts        → สีปุ่ม sweetalert
//   • inline style / logic ที่ต้องได้ค่าเป็น string/number
// ฝั่ง className ใช้ utility ของ Tailwind ตามปกติ (bg-brown-800, text-gray-600) — ไม่ต้อง import ที่นี่
//
// สเกล px ด้านล่างต้องสอดคล้องกับ src/app/globals.css:
//   typography.baseSizePx = html{font-size:112.5%}  ·  a11y/layout = ตัวเลขเดียวกับ --touch-target ฯลฯ
// ─────────────────────────────────────────────────────────────
import { brand, neutral, status } from "@/theme/palette";

/** สี — อ้างชื่อบทบาท ไม่ใช่เฉดสี */
export const color = {
  /** สเกลแบรนด์เต็ม (เผื่อ logic ที่ต้องเลือกเฉดเอง) */
  brand,

  brandPrimary: brand[800],
  brandPrimaryHover: brand[700],
  brandPrimaryActive: brand[900],
  link: brand[600],
  linkHover: brand[800],

  text: neutral.ink,
  textMuted: neutral.muted,
  textSubtle: neutral.subtle,

  bgApp: neutral.bgApp,
  surface: neutral.surface,
  border: neutral.border,
  borderSubtle: neutral.borderSubtle,

  success: status.success,
  warning: status.warning,
  danger: status.danger,
  info: status.info,

  /** สีเส้นโฟกัส (:focus-visible) */
  focusRing: brand[800],
} as const;

/** ตัวอักษร — สเกล px คือค่าที่ antd ใช้ (Tailwind ใช้ rem ของตัวเองที่ไล่จาก base 18px) */
export const typography = {
  family: "var(--font-sans)",
  /** ขนาดฐานของทั้งแอป = html{font-size:112.5%} ใน globals.css */
  baseSizePx: 18,
  lineHeight: 1.7,
  size: { sm: 15, base: 17, lg: 19, xl: 21 },
  heading: { h1: 28, h2: 24, h3: 20, h4: 18, h5: 16 },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

/** ความสูง/มุมโค้งของ control (Input, Select, Button, DatePicker …) */
export const control = {
  heightSM: 32,
  height: 40,
  heightLG: 48,
  radiusSM: 6,
  radius: 8,
  radiusLG: 12,
} as const;

/** ค่าคงที่เพื่อการเข้าถึง (a11y) — ตรงกับ --touch-target / :focus-visible ใน globals.css */
export const a11y = {
  /** พื้นที่กดขั้นต่ำของปุ่ม/ไอคอน (WCAG 2.2 — 2.5.8) */
  touchTargetPx: 44,
  focusRingWidthPx: 3,
} as const;

/** ขนาดโครงหน้า — ตรงกับ --sidebar-width / --navbar-height / --content-padding ใน globals.css */
export const layout = {
  sidebarWidthPx: 306, // ≈ 17rem ที่ฐาน 18px — globals.css ใช้ rem จริง เลขนี้อ้างอิงเฉย ๆ
  navbarHeightPx: 72, // = 4rem ที่ฐาน 18px
  contentPaddingPx: 32,
  /** เบรกพอยต์สลับ desktop/mobile (อ้างอิง — className จริงใช้ prefix lg: ของ Tailwind) */
  breakpointMobilePx: 992,
} as const;

/** transition มาตรฐาน */
export const motion = {
  fast: "0.15s ease",
  drawer: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/** เงา */
export const elevation = {
  dropdown: "0 8px 24px rgba(0, 0, 0, 0.08)",
  card: "0 1px 2px rgba(0, 0, 0, 0.04)",
} as const;

/** ลำดับชั้น z-index (จองเป็นช่วง กันชนกันเอง) */
export const zIndex = {
  navbar: 10,
  sidebarOverlay: 20,
  sidebarDrawer: 30,
  dropdown: 50,
  modal: 1000,
  toast: 1100,
} as const;

/** รวมทุกกลุ่มไว้ก้อนเดียว เผื่ออยาก import ตัวเดียว: `import { theme } from "@/theme"` */
export const theme = {
  color,
  typography,
  control,
  a11y,
  layout,
  motion,
  elevation,
  zIndex,
} as const;

export type Theme = typeof theme;
