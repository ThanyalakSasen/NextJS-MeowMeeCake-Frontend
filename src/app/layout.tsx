import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "@/app/globals.css";
import Providers from "@/app/providers";

// ฟอนต์ไทย "ไม่มีหัว" — Noto Sans Thai (variable 100–900, subset ไทย+ละติน)
// next/font ดาวน์โหลดตอน build แล้ว self-host เอง → เบราว์เซอร์ไม่ยิงขอ Google, ไม่มี layout shift
// ใช้ผ่าน CSS variable --font-sans (globals.css @theme ผูกกับตัวนี้)
const notoSansThai = Noto_Sans_Thai({
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
// inject globals.css, ครอบ NextIntlClientProvider (i18n) + antd ConfigProvider (Providers)
// locale มาจาก cookie ผ่าน src/i18n/request.ts (ไม่มี /th /en ใน URL)
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={notoSansThai.variable}>
      <body>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
