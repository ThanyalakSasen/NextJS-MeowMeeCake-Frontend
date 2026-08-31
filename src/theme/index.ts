// ─────────────────────────────────────────────────────────────
// src/theme — theme system ของโปรเจกต์ (ดู docs/THEME.md)
//
//   import { theme } from "@/theme";        → token ทั้งหมดเป็นก้อนเดียว
//   import { color, layout } from "@/theme"; → เลือกเฉพาะกลุ่ม
//   import { antdTheme } from "@/theme";     → ThemeConfig สำหรับ <ConfigProvider>
//
// อย่า import "@/theme/palette" ตรง ๆ ในหน้า/คอมโพเนนต์ — ใช้ token เชิงความหมายจากที่นี่
// ─────────────────────────────────────────────────────────────
export {
  color,
  typography,
  control,
  a11y,
  layout,
  motion,
  elevation,
  zIndex,
  theme,
} from "@/theme/tokens";
export type { Theme } from "@/theme/tokens";
export { antdTheme } from "@/theme/antdTheme";
export { brand, neutral, status } from "@/theme/palette";
export type { BrandScale, BrandStep } from "@/theme/palette";
