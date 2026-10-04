"use client";
// โครงหน้าร้าน (Navbar + เนื้อหา + Footer) — ย้ายมาจาก FrontOffice (components/customer/CustomerChrome.tsx)
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

// route ที่ไม่ต้องแสดง Navbar/Footer (หน้า flow ตั้งรหัสผ่านใหม่จากลิงก์อีเมล)
// usePathname() คืนเฉพาะ path ไม่รวม query string จึงครอบคลุม ?token=... ด้วย
const HIDE_CHROME_ROUTES = ["/customer/reset-password"];

// route ที่ไม่ต้องแสดงเฉพาะ Navbar (ยังคง Footer ไว้) — หน้า flow สั่งซื้อ/ชำระเงิน
const HIDE_NAVBAR_ROUTES = [
  "/customer/cart",
  "/customer/checkout",
  "/customer/payment",
  "/customer/preorder/checkout",
  "/customer/preorder/payment",
];

const matches = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(route + "/"));

export default function CustomerChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  if (matches(pathname, HIDE_CHROME_ROUTES)) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Navbar ใช้ useSearchParams จึงต้องครอบด้วย Suspense (ไม่งั้น next build จะ error) */}
      {!matches(pathname, HIDE_NAVBAR_ROUTES) && (
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
      )}
      {/* flex-1 ดัน Footer ให้อยู่ล่างสุดเสมอแม้เนื้อหาน้อย */}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
