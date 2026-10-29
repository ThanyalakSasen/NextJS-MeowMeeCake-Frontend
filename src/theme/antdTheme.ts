// ─────────────────────────────────────────────────────────────
// src/theme/antdTheme.ts
// แปลง token ของโปรเจกต์ → antd ThemeConfig (ใช้ใน src/app/providers.tsx)
//
// antd render Table/Input/Select/Button/Tag ฯลฯ ด้วย design token ของตัวเอง (ไม่ผ่าน class Tailwind)
// ที่นี่คือ "จุดเดียว" ที่ map token โปรเจกต์เข้ากับ token ของ antd
//
// แนวปรับ: เป็นมิตรกับผู้สูงอายุ — ตัวอักษร 16–28px, บรรทัด 1.7, control สูง 40 เท่ากันหมด
// ─────────────────────────────────────────────────────────────
import type { ThemeConfig } from "antd";
import { color, typography, control } from "@/theme/tokens";

export const antdTheme: ThemeConfig = {
  token: {
    // ── ตัวอักษร ──
    fontFamily: typography.family, // Noto Sans Thai Looped (มีหัว) — ตั้งบน <html> ที่ layout.tsx
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
    // placeholder ของ antd ค่าเริ่มต้น = ดำโปร่ง 25% (~1.9:1 บนพื้นขาว) — Select วาด placeholder เป็นข้อความจริง
    // Lighthouse "color-contrast" จึงตก · ใช้สีเดียวกับข้อความรอง (#64748B ~4.8:1)
    colorTextPlaceholder: color.textSubtle,
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
    // Select คำนวณ padding จาก fontHeight ซึ่ง antd ไม่ได้คิดจาก lineHeight ที่เราตั้ง (ได้ 26 · บรรทัดจริง 30.6)
    // → padding เกินจน Select สูง ~40.6px ไม่เท่า Input/DatePicker · ตั้งให้ตรงกับบรรทัดจริง = สูงเท่ากัน
    // fontHeight เป็น MapToken — type ของ components ไม่รวมไว้ แต่ตอนรัน antd เอา token ของ component ทับ token ทั้งหมด (วัดแล้วได้เท่า controlHeight)
    Select: {
      fontHeight: typography.size.base * typography.lineHeight,
    } as NonNullable<ThemeConfig["components"]>["Select"],
    // ปุ่มตัวอักษรหนาขึ้นนิดเพื่อการอ่าน
    Button: {
      fontWeight: 500,
    },
    // แท็บกรอง (TypeTabBar / ViewToggle) — ค่า default ของ antd คือพื้นขาวบนรางเทาอ่อน
    // บนจอแทบดูไม่ออกว่าอันไหนถูกเลือกอยู่ — ปรับให้เหมือน Radio.Group buttonStyle="solid"
    // ของฟอร์มสินค้า (น้ำตาลทึบ + ตัวอักษรขาว) ทั้งแอปจะได้ "เลือกอยู่" หน้าตาเดียว
    // ที่ไม่ได้เลือก = ปุ่มพื้นขาวมีกรอบ ต่อกันเป็นแถบ (ไม่มีรางเทา) — เส้นกรอบ/คั่นอยู่ที่ globals.css (.ant-segmented)
    Segmented: {
      trackBg: color.surface,
      trackPadding: 0,
      itemSelectedBg: color.brandPrimary,
      itemSelectedColor: color.surface,
      itemColor: color.textMuted,
      itemHoverColor: color.brandPrimary,
    },
  },
};
