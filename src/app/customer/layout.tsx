import { NextIntlClientProvider } from "next-intl";
import { HydrationBoundary } from "@tanstack/react-query";
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

// โลโก้ร้าน (Navbar/Footer ทุกหน้า) ดึงฝั่ง server ก่อน — เดิมโลโก้สำรองขึ้นก่อนแล้วสลับเป็นของจริงหลัง JS ทำงาน
export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const state = await prefetchPublic([{ queryKey: storeLogoKey, queryFn: storeInfoService.logo }]);
  return (
    <NextIntlClientProvider locale="th" messages={shopMessages}>
      <HydrationBoundary state={state}>
        <CustomerChrome>{children}</CustomerChrome>
      </HydrationBoundary>
    </NextIntlClientProvider>
  );
}
