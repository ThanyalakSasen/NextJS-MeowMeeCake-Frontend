import { NextIntlClientProvider } from "next-intl";
import CustomerChrome from "@/components/customer/CustomerChrome";
import thMessages from "@/i18n/messages/th.json";

// ─────────────────────────────────────────────────────────────
// Layout ของหน้าร้าน (/customer/*) — ย้ายมาจาก FrontOffice (เลิกใช้ backend port 4000 แล้ว)
// ทุกหน้าคุยกับ backend ตัวเดียวกับหลังร้าน ผ่าน /catalog/* (ไม่ต้อง login) และ /shop/* (ต้อง login)
// guest เปิดดูได้ — หน้าที่ต้อง login เช็คเองด้วย useCustomerSession (ไม่เด้ง login ตั้งแต่ layout)
// หน้าร้านใช้ภาษาไทยอย่างเดียว (เจ้าของร้านตอบ Q-BE19 · 2026-10-09) — บังคับ locale "th" ทับ cookie ภาษาของหลังร้าน
// ข้อความยังอยู่ใน i18n (shop.* ทั้ง th/en) — เปิดภาษาอังกฤษภายหลังได้ด้วยการเอา provider นี้ออก + ใส่ปุ่มสลับภาษากลับ
// ─────────────────────────────────────────────────────────────
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="th" messages={thMessages}>
      <CustomerChrome>{children}</CustomerChrome>
    </NextIntlClientProvider>
  );
}
