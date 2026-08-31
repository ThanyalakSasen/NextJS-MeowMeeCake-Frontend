"use client";

import { useEffect, useState } from "react";
import { App, ConfigProvider } from "antd";
import type { ThemeConfig } from "antd";
import thTH from "antd/locale/th_TH";
import enUS from "antd/locale/en_US";
import { useLocale } from "next-intl";
import { QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/th";
import "dayjs/locale/en";
import { makeQueryClient } from "@/lib/queryClient";
import { AuthBootstrap } from "@/components/providers/AuthBootstrap";
import { MSWReady } from "@/components/providers/MSWReady";

// ตั้ง dayjs locale เริ่มต้นตรงนี้ (ก่อนคอมโพเนนต์ใน tree เรนเดอร์) กัน DatePicker/Calendar
// แสดงเดือน/วันเป็นภาษาผิดหลุดมาแวบหนึ่งตอนโหลดหน้าครั้งแรก — ค่าจริงถูกซิงก์กับ i18n ใน useEffect ด้านล่าง
dayjs.locale("th");

// antd render ฟอนต์ของ Table/Select/Input/Button/Tag ฯลฯ ด้วย design token ของตัวเอง
// (ไม่ผ่านคลาส Tailwind text-*) — ตั้ง token ที่นี่ครั้งเดียว
// ปรับให้เป็นมิตรกับผู้สูงอายุ: ตัวอักษร 16–28px, บรรทัดสูง 1.7, ช่องกรอก/ปุ่มสูง 40–48px
const theme: ThemeConfig = {
  token: {
    // ฟอนต์ Noto Sans Thai (ไม่มีหัว) เดียวกับทั้งแอป — ผูกผ่าน CSS var ที่ layout.tsx ตั้งไว้บน <html>
    fontFamily: "var(--font-sans)",

    fontSize: 17, // ฐาน (เดิม 14) — ใกล้เคียง body 18px ของฝั่ง Tailwind
    fontSizeSM: 15, // เล็กสุด — label ตาราง / tag
    fontSizeLG: 19,
    fontSizeXL: 21,
    fontSizeIcon: 16,
    fontSizeHeading1: 28,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
    lineHeight: 1.7,

    // ความสูง control — Input / Select / DatePicker / Button กดง่ายขึ้นด้วยนิ้ว
    controlHeightSM: 32,
    controlHeight: 40, // default (เดิม 32)
    controlHeightLG: 48,

    // ธีมสีน้ำตาล (Coffee) — สีหลักของแบรนด์ ให้คอมโพเนนต์ antd ที่ไม่ได้ครอบสีด้วย Tailwind
    // ใช้สีนี้แทนสีฟ้า default ของ antd (Switch ตอนเปิด, focus ring, ปุ่ม primary เปล่า, ลิงก์)
    colorPrimary: "#4B2E2B",
    colorPrimaryHover: "#603D2A",
    colorPrimaryActive: "#37201D",
    colorLink: "#7C4F35",
    colorLinkHover: "#4B2E2B",

    // ข้อความเข้มขึ้นเพื่อคอนทราสต์ (เดิม antd ใช้เทาอ่อนเกินสำหรับสายตาผู้สูงอายุ)
    colorText: "#3d2523",
    colorTextSecondary: "#4b5563",
    colorTextTertiary: "#64748b",
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  // client เดียวตลอด lifetime ของหน้า (อย่าสร้างใหม่ทุก render)
  const [queryClient] = useState(makeQueryClient);

  // ซิงก์ dayjs กับภาษาที่ผู้ใช้เลือก (i18n) — กระทบ DatePicker/Calendar/relativeTime ทั้งแอป
  useEffect(() => {
    dayjs.locale(locale === "en" ? "en" : "th");
  }, [locale]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      {/* locale ของ antd (ชื่อเดือน/วัน, ปุ่ม "วันนี้"/"ตกลง", ข้อความแบ่งหน้า ฯลฯ) ตามภาษาที่เลือก */}
      <ConfigProvider theme={theme} locale={locale === "en" ? enUS : thTH}>
        {/* <App> ส่ง theme ต่อไปถึง feedback component ของ antd (เช่น Popconfirm)
            popup แจ้งเตือน/ยืนยันหลักย้ายไปใช้ sweetalert2 แล้ว — ดู src/lib/alert.ts */}
        <App>
          {/* mock mode: รอ MSW พร้อมก่อน render (กัน request แรกหลุด) */}
          <MSWReady>{children}</MSWReady>
        </App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
