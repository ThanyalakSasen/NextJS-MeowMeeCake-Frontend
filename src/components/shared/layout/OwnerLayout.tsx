"use client";

// ─────────────────────────────────────────────────────────────
// OwnerLayout — เทมเพลตหน้าหลังบ้าน
// auth gate (useCurrentUser) + idle timeout + PermissionsProvider + Sidebar + Navbar
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { logout } from "@/lib/authClient";
import { confirmAlert } from "@/lib/alert";
import { ACCESS_DENIED_PATH, CUSTOMER_HOME_PATH, LOGIN_PATH } from "@/constants/auth";
import { resolveMenuKey } from "@/constants/menuKeys";
import { firstPermittedPath } from "@/lib/landingPath";
import { LoadingSpin } from "@/components/shared/feedback";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

const noopSubscribe = () => () => {};

/**
 * หน้าที่ render เนื้อหาฝั่ง server ได้ (สถานะโหลดใช้ isPending — ปลอดภัยตอน SSR) → หัวข้อหน้า (LCP) อยู่ใน HTML แรก
 * หน้าอื่นยังใช้ isLoading ของ react-query (false ตอน SSR = เห็นสถานะว่างแวบ) → render หลัง hydrate
 * เพิ่มหน้าได้เมื่อแก้สถานะโหลดของหน้านั้นเป็น isPending แล้ว
 */
const SSR_PAGES = ["/owner/dashboard", "/owner/reports/sales", "/owner/reports/reviews", "/owner/finance/expenses", "/owner/finance/summary", "/owner/products", "/owner/orders/manageOrders", "/owner/products/productStock"];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { user, isLoading, isError } = useCurrentUser();
  // false ตอน render ฝั่ง server + รอบ hydrate (ค่าเดียวกัน) → true หลัง hydrate
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // แนบ next ไว้ด้วย — โหมด AUTH_GATE="client" ไม่มี proxy ช่วยใส่ ?next= ให้ (LoginForm รับเฉพาะ path ที่ขึ้นต้น /owner)
    // รวม query เดิม (เช่น ?id= จากลิงก์ LINE) — อ่านจาก window ใน effect แทน useSearchParams กัน layout ทั้งก้อนต้องอยู่ใต้ Suspense
    if (isError) router.replace(`${LOGIN_PATH}?reason=expired&next=${encodeURIComponent(pathname + window.location.search)}`);
  }, [isError, router, pathname]);

  // ลูกค้าที่ login อยู่ (เช่นพิมพ์ URL /owner เอง) → ส่งกลับหน้าร้าน — หลังร้านไม่มีอะไรให้ลูกค้าใช้
  const isCustomer = user?.roleType === "customer";
  useEffect(() => {
    if (isCustomer) router.replace(CUSTOMER_HOME_PATH);
  }, [isCustomer, router]);

  // กั้นหน้าตามสิทธิ์: path ที่ผูก menu_key (constants/menuKeys.ts ROUTE_MENU_MAP) แต่ไม่มีสิทธิ์ view → หน้า access-denied
  // ยกเว้นแดชบอร์ด (หน้าแรกหลังล็อกอิน · ลิงก์ "หน้าหลัก") → พาไปหน้าแรกที่มีสิทธิ์แทน (lib/landingPath.ts — Final-Backlog P11)
  // path ที่ไม่ผูก key (store-design ฯลฯ) = login พอ · owner มี view ทุกเมนูเสมอ
  // นี่คือ UX gate — ข้อมูลจริงถูก backend กั้นอยู่แล้วทุก route (403) · สิทธิ์ถูกเพิกถอนระหว่างใช้งาน
  // จะมีผลเมื่อ useCurrentUser refetch (โฟกัสแท็บ / ทุก 60 วินาที)
  const menuKey = resolveMenuKey(pathname);
  // ลูกค้าไม่นับ — effect ด้านบนส่งกลับหน้าร้านอยู่แล้ว (เดิมสองอันชนกัน: ลูกค้าที่เปิด /login ซ้ำถูก proxy พามา
  // /owner/dashboard แล้ว access-denied ชนะ → ค้างหน้า "ไม่มีสิทธิ์" ของหลังร้าน)
  const denied = !!user && !isCustomer && !!menuKey && !user.menuAccess[menuKey]?.view;
  const deniedTarget = denied
    ? (menuKey === "dashboard" && user ? firstPermittedPath(user.menuAccess) : null) ?? ACCESS_DENIED_PATH
    : null;
  useEffect(() => {
    if (deniedTarget) router.replace(deniedTarget);
  }, [deniedTarget, router]);

  // ปิด drawer เมื่อเปลี่ยนหน้า (mobile) — side effect ต่อ navigation จริง ไม่ derive ได้
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace(LOGIN_PATH);
  }, [router]);

  const onWarn = useCallback(async () => {
    const stay = await confirmAlert(t("auth.sessionExpiringDetail"), {
      title: t("auth.sessionExpiring"),
      confirmText: t("auth.stayLoggedIn"),
      cancelText: t("nav.logout"),
      // ปุ่มยกเลิก = "ออกจากระบบ" — เดิมกด Esc/คลิกนอกกล่องได้ผลเป็น "ไม่ยืนยัน" แล้วโดน logout ทันทีโดยไม่ได้ตั้งใจ
      dismissible: false,
    });
    // "อยู่ต่อ" ไม่ต้องทำอะไร — การกดปุ่มยืนยันเป็น activity ที่รีเซ็ต timer ใน useIdleTimeout เอง
    // (backend ไม่มี refresh token/sliding expiry จึงไม่มีอะไรให้ต่ออายุฝั่ง server)
    if (!stay) handleLogout();
  }, [t, handleLogout]);

  const onTimeout = useCallback(async () => {
    await logout();
    router.replace(`${LOGIN_PATH}?reason=timeout`);
  }, [router]);

  useIdleTimeout({ enabled: !!user, onWarn, onTimeout });

  // denied: ไม่ render เนื้อหาหน้านั้นเลยระหว่างรอ redirect (กัน flash + กันหน้ายิง API ที่จะได้ 403)
  if (isLoading || !user || denied || isCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpin />
      </div>
    );
  }

  return (
    <PermissionsProvider value={user.menuAccess}>
      <div className="layout-shell">
        {/* desktop */}
        <div className="hidden lg:block">
          <Sidebar onLogout={handleLogout} />
        </div>

        {/* mobile drawer */}
        {drawerOpen && (
          <div className="sidebar-overlay lg:hidden" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
        )}
        <div className={`sidebar-drawer lg:hidden ${drawerOpen ? "open" : ""}`}>
          <Sidebar onLogout={handleLogout} />
        </div>

        <div className="layout-main">
          <Navbar user={user} onLogout={handleLogout} onToggleSidebar={() => setDrawerOpen((p) => !p)} />
          {/* user มาจาก server แล้ว (src/lib/serverAuth.ts) → โครงหน้า (sidebar/navbar) อยู่ใน HTML แรก
              เนื้อหาหน้า: SSR_PAGES render ฝั่ง server ด้วย · หน้าอื่น render หลัง hydrate (ระหว่างนั้นว่าง — เดิมใส่วงหมุน
              แล้วพอหน้าขึ้นวงหมุนถูกดันลง = CLS 0.22 · ว่างไว้ไม่มีอะไรให้ขยับ) */}
          <main className="layout-content">{hydrated || SSR_PAGES.includes(pathname) ? children : null}</main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
