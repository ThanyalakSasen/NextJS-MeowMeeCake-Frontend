"use client";
// ─────────────────────────────────────────────────────────────
// AntdProviders — theme/locale ของ antd + dayjs locale · ใช้เฉพาะส่วนที่ใช้ antd จริง
// (หลังร้าน · /profile · บัญชีลูกค้า · กล่อง alert แบบโหลดตามต้องการ)
// เดิมอยู่ใน providers.tsx ที่ครอบทุกหน้า → หน้าร้านสาธารณะ (Tailwind ล้วน) โหลด antd ~180 KB (gzip) ทุกหน้า
// ทำให้ Lighthouse Performance หน้าร้านต่ำ (JS เยอะ → LCP/TBT จำลองบนมือถือช้า)
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { App, ConfigProvider } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import thTH from "antd/locale/th_TH";
import enUS from "antd/locale/en_US";
import { useLocale } from "next-intl";
import dayjs from "dayjs";
import "dayjs/locale/th";
import "dayjs/locale/en";
import { antdTheme } from "@/theme";

// ตั้ง dayjs locale เริ่มต้นตรงนี้ (ก่อนคอมโพเนนต์ใน tree เรนเดอร์) กัน DatePicker/Calendar
// แสดงเดือน/วันเป็นภาษาผิดหลุดมาแวบหนึ่งตอนโหลดหน้าครั้งแรก — ค่าจริงถูกซิงก์กับ i18n ใน useEffect ด้านล่าง
dayjs.locale("th");

// antd ThemeConfig มาจาก theme system ของโปรเจกต์ — แก้ token ที่ src/theme/tokens.ts (ดู docs/THEME.md)
export function AntdProviders({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  // ซิงก์ dayjs กับภาษาที่ผู้ใช้เลือก (i18n) — กระทบ DatePicker/Calendar/relativeTime
  useEffect(() => {
    dayjs.locale(locale === "en" ? "en" : "th");
  }, [locale]);

  return (
    // layer: style ของ antd อยู่ใน @layer antd — class Tailwind ชนะได้ (ลำดับ layer ประกาศใน globals.css · BACKLOG4 V9)
    <StyleProvider layer>
      {/* locale ของ antd (ชื่อเดือน/วัน, ปุ่ม "วันนี้"/"ตกลง", ข้อความแบ่งหน้า ฯลฯ) ตามภาษาที่เลือก */}
      <ConfigProvider theme={antdTheme} locale={locale === "en" ? enUS : thTH}>
        {/* <App> ส่ง theme ต่อไปถึง feedback component ของ antd */}
        <App>{children}</App>
      </ConfigProvider>
    </StyleProvider>
  );
}
