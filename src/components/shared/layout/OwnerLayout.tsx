"use client";

// ─────────────────────────────────────────────────────────────
// src/components/shared/layout/OwnerLayout.tsx
// เทมเพลตหน้าหลังบ้าน — โหลดผู้ใช้, กัน session หมด, idle timeout, ป้อน PermissionsContext
// โครง Sidebar/Navbar ตอนนี้เป็น placeholder → เฟส 3 จะใส่ <Sidebar/> <Navbar/> จริง
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Spin } from "antd";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { logout, refresh } from "@/lib/authClient";
import { confirmAlert } from "@/lib/alert";
import { LOGIN_PATH } from "@/constants/auth";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations();
  const { user, isLoading, isError } = useCurrentUser();

  // session ใช้ไม่ได้ (401 หลัง refresh ไม่ผ่าน) → กลับหน้า login
  useEffect(() => {
    if (isError) router.replace(`${LOGIN_PATH}?reason=expired`);
  }, [isError, router]);

  const onWarn = useCallback(async () => {
    const stay = await confirmAlert(t("auth.sessionExpiringDetail"), {
      title: t("auth.sessionExpiring"),
      confirmText: t("auth.stayLoggedIn"),
      cancelText: t("nav.logout"),
    });
    if (stay) {
      refresh().catch(() => {});
    } else {
      await logout();
      router.replace(LOGIN_PATH);
    }
  }, [t, router]);

  const onTimeout = useCallback(async () => {
    await logout();
    router.replace(`${LOGIN_PATH}?reason=timeout`);
  }, [router]);

  useIdleTimeout({ enabled: !!user, onWarn, onTimeout });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip={t("common.loading")}>
          <div className="p-8" />
        </Spin>
      </div>
    );
  }

  return (
    <PermissionsProvider value={user.menuAccess}>
      <div className="min-h-screen flex bg-[color:var(--content-bg)]">
        {/* เฟส 3: <Sidebar/> */}
        <aside className="w-60 shrink-0 border-r border-gray-100 bg-white p-4 hidden lg:block">
          <p className="text-lg font-medium text-brown-900">{t("common.appName")}</p>
          <p className="text-xs text-gray-400">{t("common.appTagline")}</p>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* เฟส 3: <Navbar/> */}
          <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-5">
            <span className="text-sm text-gray-500">{user.roleName || user.fullname}</span>
            <button
              type="button"
              className="text-sm text-red-500 hover:underline"
              onClick={async () => {
                await logout();
                router.replace(LOGIN_PATH);
              }}
            >
              {t("nav.logout")}
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
