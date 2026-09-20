"use client";

// ─────────────────────────────────────────────────────────────
// OwnerLayout — เทมเพลตหน้าหลังบ้าน
// auth gate (useCurrentUser) + idle timeout + PermissionsProvider + Sidebar + Navbar
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { logout } from "@/lib/authClient";
import { confirmAlert } from "@/lib/alert";
import { ACCESS_DENIED_PATH, LOGIN_PATH } from "@/constants/auth";
import { resolveMenuKey } from "@/constants/menuKeys";
import { LoadingSpin } from "@/components/shared/feedback";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { user, isLoading, isError } = useCurrentUser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (isError) router.replace(`${LOGIN_PATH}?reason=expired`);
  }, [isError, router]);

  // กั้นหน้าตามสิทธิ์: path ที่ผูก menu_key (constants/menuKeys.ts ROUTE_MENU_MAP) แต่ไม่มีสิทธิ์ view → หน้า access-denied
  // path ที่ไม่ผูก key (dashboard, attendance ฯลฯ) = login พอ · owner มี view ทุกเมนูเสมอ
  // นี่คือ UX gate — ข้อมูลจริงถูก backend กั้นอยู่แล้วทุก route (403) · สิทธิ์ถูกเพิกถอนระหว่างใช้งาน
  // จะมีผลเมื่อ useCurrentUser refetch (โฟกัสแท็บ / ทุก 60 วินาที)
  const menuKey = resolveMenuKey(pathname);
  const denied = !!user && !!menuKey && !user.menuAccess[menuKey]?.view;
  useEffect(() => {
    if (denied) router.replace(ACCESS_DENIED_PATH);
  }, [denied, router]);

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
  if (isLoading || !user || denied) {
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
          <main className="layout-content">{children}</main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
