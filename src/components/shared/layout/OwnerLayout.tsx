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
import { logout, refresh } from "@/lib/authClient";
import { confirmAlert } from "@/lib/alert";
import { LOGIN_PATH } from "@/constants/auth";
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
    if (stay) refresh().catch(() => {});
    else handleLogout();
  }, [t, handleLogout]);

  const onTimeout = useCallback(async () => {
    await logout();
    router.replace(`${LOGIN_PATH}?reason=timeout`);
  }, [router]);

  useIdleTimeout({ enabled: !!user, onWarn, onTimeout });

  if (isLoading || !user) {
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
