import type { Metadata } from "next";
import { Noto_Sans_Thai_Looped } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "@/app/globals.css";
import Providers from "@/app/providers";

// ฟอนต์ไทย "มีหัว" — Noto Sans Thai Looped (variable 100–900, subset ไทย+ละติน)
// next/font ดาวน์โหลดตอน build แล้ว self-host เอง → เบราว์เซอร์ไม่ยิงขอ Google, ไม่มี layout shift
// ใช้ผ่าน CSS variable --font-sans (globals.css @theme ผูกกับตัวนี้)
const notoSansThai = Noto_Sans_Thai_Looped({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-thai",
});

export const metadata: Metadata = {
  title: "MeowMee Cake",
  description: "ระบบจัดการร้าน MeowMee Cake",
};

// Root layout — ไม่มี Sidebar/Navbar
// inject globals.css, ครอบ NextIntlClientProvider (i18n — เฉพาะ alert/common) + Providers (react-query · alert)
// locale มาจาก cookie ผ่าน src/i18n/request.ts (ไม่มี /th /en ใน URL)
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  // ส่งให้ client แค่ข้อความของกล่อง alert (alert.* · common.*) — แต่ละส่วนมี provider ของตัวเอง:
  // หลังร้าน/login/register/profile = ทั้งชุด · หน้าร้าน = shop.* (เดิมส่งทั้งไฟล์ ~240 KB ไปกับ HTML ทุกหน้า)
  const all = await getMessages();
  const messages = { alert: all.alert, common: all.common };

  return (
    <html lang={locale} className={notoSansThai.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
