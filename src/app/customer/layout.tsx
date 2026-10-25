import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { HydrationBoundary } from "@tanstack/react-query";
import { CUSTOMER_SESSION_KEY } from "@/constants/auth";
import { LOCALE_COOKIE } from "@/i18n/config";
import { currentUserOnServer } from "@/lib/serverAuth";
import type { CurrentUser } from "@/types/auth";
import { storeInfoService } from "@/services/storeInfo";
import { storeLogoKey } from "./lib/catalogQueries";
import { prefetchPublic } from "./lib/prefetchPublic";
import CustomerChrome from "@/components/customer/CustomerChrome";
import thMessages from "@/i18n/messages/th.json";

// ─────────────────────────────────────────────────────────────
// Layout ของหน้าร้าน (/customer/*) — ย้ายมาจาก FrontOffice (เลิกใช้ backend port 4000 แล้ว)
// ทุกหน้าคุยกับ backend ตัวเดียวกับหลังร้าน ผ่าน /catalog/* (ไม่ต้อง login) และ /shop/* (ต้อง login)
// guest เปิดดูได้ — หน้าที่ต้อง login เช็คเองด้วย useCustomerSession (ไม่เด้ง login ตั้งแต่ layout)
// หน้าร้านใช้ภาษาไทยอย่างเดียว (เจ้าของร้านตอบ Q-BE19 · 2026-10-09) — บังคับ locale "th" ทับ cookie ภาษาของหลังร้าน
// ข้อความยังอยู่ใน i18n (shop.* ทั้ง th/en) — เปิดภาษาอังกฤษภายหลังได้ด้วยการเอา provider นี้ออก + ใส่ปุ่มสลับภาษากลับ
// ─────────────────────────────────────────────────────────────
// ส่งเฉพาะ shop.* ไปกับ HTML (~73 KB แทนทั้งไฟล์ ~240 KB) — โค้ดหน้าร้านใช้แต่ useTranslations("shop.*")
// ถ้าเพิ่มคอมโพเนนต์ที่ใช้ namespace อื่นในหน้าร้าน ต้องเพิ่มชื่อที่นี่ด้วย
const shopMessages = { shop: thMessages.shop };

// cookie ที่ไม่ใช่ session login — มีแต่พวกนี้ = guest ไม่ต้องถาม backend (ไม่เพิ่ม TTFB ให้หน้าสาธารณะ)
const NON_SESSION_COOKIES = new Set([LOCALE_COOKIE, "g_state"]);

/**
 * ผู้ใช้ที่ login อยู่จาก cookie ฝั่ง server (แบบเดียวกับ layout หลังร้าน) → useCustomerSession ได้ค่าตั้งแต่ HTML แรก
 * เดิมหน้าที่ต้อง login (CustomerAuthGate) ส่ง HTML เป็นวงหมุน → รอ JS → ถาม /auth/me → ค่อยวาดหน้า
 * (Lighthouse มือถือ LCP ~3.6 วิ · วงหมุนถูกแทนด้วยเนื้อหา = CLS 0.19) · Navbar ก็ได้สถานะ login ทันที
 * ต้องอยู่ layout นี้ (เหนือ Navbar) — ถ้า Navbar สร้าง query ไปก่อน HydrationBoundary จะเลื่อนไปใส่ค่าหลัง render
 * ไม่ได้ผู้ใช้ (guest / 401 / backend ช้า / error) = throw → prefetchQuery ไม่ส่งไป browser ให้ถามเองเหมือนเดิม
 */
async function sessionOnServer(): Promise<CurrentUser> {
  const jar = await cookies();
  if (!jar.getAll().some((c) => !NON_SESSION_COOKIES.has(c.name))) throw new Error("guest");
  const user = await currentUserOnServer();
  if (!user) throw new Error("no session");
  return user;
}

// โลโก้ร้าน (Navbar/Footer ทุกหน้า) ดึงฝั่ง server ก่อน — เดิมโลโก้สำรองขึ้นก่อนแล้วสลับเป็นของจริงหลัง JS ทำงาน
export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const state = await prefetchPublic([
    { queryKey: storeLogoKey, queryFn: storeInfoService.logo },
    { queryKey: CUSTOMER_SESSION_KEY, queryFn: sessionOnServer },
  ]);
  return (
    <NextIntlClientProvider locale="th" messages={shopMessages}>
      <HydrationBoundary state={state}>
        <CustomerChrome>{children}</CustomerChrome>
      </HydrationBoundary>
    </NextIntlClientProvider>
  );
}
