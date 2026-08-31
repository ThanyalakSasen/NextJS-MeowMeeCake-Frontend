"use client";

import { useEffect, useState } from "react";
import { App, ConfigProvider } from "antd";
import thTH from "antd/locale/th_TH";
import enUS from "antd/locale/en_US";
import { useLocale } from "next-intl";
import { QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/th";
import "dayjs/locale/en";
import { makeQueryClient } from "@/lib/queryClient";
import { antdTheme } from "@/theme";
import { AuthBootstrap } from "@/components/providers/AuthBootstrap";
import { MSWReady } from "@/components/providers/MSWReady";

// ตั้ง dayjs locale เริ่มต้นตรงนี้ (ก่อนคอมโพเนนต์ใน tree เรนเดอร์) กัน DatePicker/Calendar
// แสดงเดือน/วันเป็นภาษาผิดหลุดมาแวบหนึ่งตอนโหลดหน้าครั้งแรก — ค่าจริงถูกซิงก์กับ i18n ใน useEffect ด้านล่าง
dayjs.locale("th");

// antd ThemeConfig มาจาก theme system ของโปรเจกต์ — แก้ token ที่ src/theme/tokens.ts (ดู docs/THEME.md)

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
      <ConfigProvider theme={antdTheme} locale={locale === "en" ? enUS : thTH}>
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
