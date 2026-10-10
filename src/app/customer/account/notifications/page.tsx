"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/notifications — การแจ้งเตือนทั้งหมด (BACKLOG3-merge D6) · ยกจาก FrontOffice customer/account/notifications/page.tsx
// รายการ/อ่าน: components/customer/CustomerNotifications (cache เดียวกับกระดิ่งบน Navbar)
// ─────────────────────────────────────────────────────────────
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { NotificationList } from "@/components/customer/CustomerNotifications";
import { shopPage } from "@/components/customer/shopStyles";

export default function NotificationsPage() {
  const t = useTranslations("shop");
  return (
    <CustomerAuthGate message={t("notifications.loginToView")}>
      <div className={shopPage}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
          <CustomerBreadcrumb items={[{ label: t("orders.myAccount"), href: "/customer/account" }, { label: t("notifications.title") }]} className="!mb-0" />
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <header className="border-b border-stone-200 pb-5">
                <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                  <Bell className="h-6 w-6 text-[#4A342E]" aria-hidden="true" /> {t("notifications.title")}
                </h1>
              </header>
              <NotificationList />
            </div>
          </div>
        </div>
      </div>
    </CustomerAuthGate>
  );
}
