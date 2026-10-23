import { HydrationBoundary } from "@tanstack/react-query";
import { shopProfileService } from "@/services/shopProfile";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import { shopProfileKey } from "@/app/customer/lib/shopQueries";
import AccountPage from "./AccountPageClient";

// บัญชีของฉัน (หลังร้าน) — ดึงข้อมูลของฉัน (แท็บแรกที่เปิด) ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมขึ้นวงหมุนจน JS ทำงาน + รอ API · key ร่วมกับ ViewModel (shopProfileKey) · แท็บประวัติดึงเมื่อเปิดแท็บ (เหมือนเดิม)
export default async function AccountRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(h ? [{ queryKey: [...shopProfileKey], queryFn: () => shopProfileService.get(h) }] : []);
  return (
    <HydrationBoundary state={state}>
      <AccountPage />
    </HydrationBoundary>
  );
}
