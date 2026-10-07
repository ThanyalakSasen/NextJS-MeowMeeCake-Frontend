"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/notifications — การแจ้งเตือนทั้งหมด (BACKLOG3-merge D6) · ยกจาก FrontOffice customer/account/notifications/page.tsx
// รายการ/อ่าน: components/customer/CustomerNotifications (cache เดียวกับกระดิ่งบน Navbar)
// ─────────────────────────────────────────────────────────────
import { Bell } from "lucide-react";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import { NotificationList } from "@/components/customer/CustomerNotifications";
import { shopPage } from "@/components/customer/shopStyles";

export default function NotificationsPage() {
  return (
    <CustomerAuthGate message="กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน">
      <div className={shopPage}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
          <CustomerBreadcrumb items={[{ label: "บัญชีของฉัน", href: "/customer/account" }, { label: "การแจ้งเตือน" }]} className="!mb-0" />
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
            <AccountSideMenu />
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <header className="border-b border-stone-200 pb-5">
                <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                  <Bell className="h-6 w-6 text-[#4A342E]" aria-hidden="true" /> การแจ้งเตือน
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
