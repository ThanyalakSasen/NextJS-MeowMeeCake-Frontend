// ─────────────────────────────────────────────────────────────
// src/theme/antdTheme.ts
// แปลง token ของโปรเจกต์ → antd ThemeConfig (ใช้ใน src/app/providers.tsx)
//
// antd render Table/Input/Select/Button/Tag ฯลฯ ด้วย design token ของตัวเอง (ไม่ผ่าน class Tailwind)
// ที่นี่คือ "จุดเดียว" ที่ map token โปรเจกต์เข้ากับ token ของ antd
//
// แนวปรับ: เป็นมิตรกับผู้สูงอายุ — ตัวอักษร 15–28px, บรรทัด 1.7, control สูง 32/40/48
// ─────────────────────────────────────────────────────────────
import type { ThemeConfig } from "antd";
import { color, typography, control } from "@/theme/tokens";

export const antdTheme: ThemeConfig = {
  token: {
    // ── ตัวอักษร ──
    fontFamily: typography.family, // Noto Sans Thai (ไม่มีหัว) — ตั้งบน <html> ที่ layout.tsx
    fontSize: typography.size.base,
    fontSizeSM: typography.size.sm,
    fontSizeLG: typography.size.lg,
    fontSizeXL: typography.size.xl,
    fontSizeIcon: 16,
    fontSizeHeading1: typography.heading.h1,
    fontSizeHeading2: typography.heading.h2,
    fontSizeHeading3: typography.heading.h3,
    fontSizeHeading4: typography.heading.h4,
    fontSizeHeading5: typography.heading.h5,
    lineHeight: typography.lineHeight,

    // ── control (Input/Select/Button/DatePicker) ──
    controlHeightSM: control.heightSM,
    controlHeight: control.height,
    controlHeightLG: control.heightLG,
    borderRadius: control.radius,
    borderRadiusLG: control.radiusLG,
    borderRadiusSM: control.radiusSM,

    // ── สีแบรนด์ (Coffee) แทนสีฟ้า default ของ antd ──
    colorPrimary: color.brandPrimary,
    colorPrimaryHover: color.brandPrimaryHover,
    colorPrimaryActive: color.brandPrimaryActive,
    colorLink: color.link,
    colorLinkHover: color.linkHover,

    // ── ข้อความ / เส้น / พื้น ── (เข้มขึ้นเพื่อคอนทราสต์)
    colorText: color.text,
    colorTextSecondary: color.textMuted,
    colorTextTertiary: color.textSubtle,
    colorBorder: color.border,
    colorBorderSecondary: color.borderSubtle,
    colorBgContainer: color.surface,
    colorBgLayout: color.bgApp,

    // ── สถานะ ──
    colorSuccess: color.success,
    colorWarning: color.warning,
    colorError: color.danger,
    colorInfo: color.info,
  },
  components: {
    // หัวตารางให้เข้มพออ่าน (default ของ antd จางไป)
    Table: {
      headerColor: color.textMuted,
      headerBg: color.borderSubtle,
      rowHoverBg: color.bgApp,
    },
    // ปุ่มตัวอักษรหนาขึ้นนิดเพื่อการอ่าน
    Button: {
      fontWeight: 500,
    },
  },
};
