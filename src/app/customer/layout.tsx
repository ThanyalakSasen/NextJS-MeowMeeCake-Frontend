import CustomerChrome from "@/components/customer/CustomerChrome";

// ─────────────────────────────────────────────────────────────
// Layout ของหน้าร้าน (/customer/*) — ย้ายมาจาก FrontOffice (เลิกใช้ backend port 4000 แล้ว)
// ทุกหน้าคุยกับ backend ตัวเดียวกับหลังร้าน ผ่าน /catalog/* (ไม่ต้อง login) และ /shop/* (ต้อง login)
// guest เปิดดูได้ — หน้าที่ต้อง login เช็คเองด้วย useCustomerSession (ไม่เด้ง login ตั้งแต่ layout)
// ข้อความไทยในโฟลเดอร์นี้ยกเว้นจาก check-i18n ไว้ก่อน (ตัดสินใจ 2026-10-04 แบบ ข — ทยอยย้ายเข้า i18n ทีหลัง)
// ─────────────────────────────────────────────────────────────
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerChrome>{children}</CustomerChrome>;
}
