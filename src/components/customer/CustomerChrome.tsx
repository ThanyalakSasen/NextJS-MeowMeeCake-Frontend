"use client";
// โครงหน้าร้าน (Navbar + เนื้อหา + Footer) — ย้ายมาจาก FrontOffice (components/customer/CustomerChrome.tsx)
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget from "./chat/ChatWidget";
import ProfileSetupPrompt from "./ProfileSetupPrompt";

// route ที่ไม่ต้องแสดง Navbar/Footer (หน้าที่เปิดจากลิงก์ในอีเมล: ตั้งรหัสผ่านใหม่ · ยืนยันอีเมล)
// usePathname() คืนเฉพาะ path ไม่รวม query string จึงครอบคลุม ?token=... ด้วย
const HIDE_CHROME_ROUTES = ["/customer/reset-password", "/customer/verify-email"];

const matches = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(route + "/"));

export default function CustomerChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  if (matches(pathname, HIDE_CHROME_ROUTES)) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Navbar ใช้ useSearchParams จึงต้องครอบด้วย Suspense (ไม่งั้น next build จะ error) */}
      {/* ทุกหน้า (รวมตะกร้า/checkout ทั้งออเดอร์และพรีออเดอร์) ใช้ Navbar ปกติ — FrontOffice เดิมมี header ของตัวเองในหน้าเหล่านั้น */}
      {/* fallback = แถบสีเดียวกับ Navbar (fixed — ไม่ดันเนื้อหา) กัน Navbar โผล่ทีหลังเป็นจอขาว */}
      <Suspense fallback={<div className="fixed inset-x-0 top-0 z-50 h-[113px] bg-[#4A342E] md:h-[129px]" aria-hidden="true" />}>
        <Navbar />
      </Suspense>
      {/* flex-1 ดัน Footer ให้อยู่ล่างสุดเสมอแม้เนื้อหาน้อย */}
      <main className="flex-1">{children}</main>
      <Footer />
      {/* แชทกับร้าน — ปุ่มลอยมุมล่างขวาทุกหน้า (เดิมเป็นไอคอนบน Navbar) */}
      <ChatWidget />
      {/* สมัครด้วย Google/LINE ใหม่ — ป๊อปอัปชวนกรอกข้อมูลบัญชี (กรอกเลย / ไว้ภายหลัง) */}
      <ProfileSetupPrompt />
    </div>
  );
}
