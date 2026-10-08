"use client";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { buildBreadcrumbs } from "@/constants/breadcrumb";
import type { CurrentUser } from "@/types/auth";
import { BreadcrumbTrail } from "./BreadcrumbTrail";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserMenuDropdown } from "./UserMenuDropdown";

export function Navbar({
  user,
  onLogout,
  onToggleSidebar,
}: {
  user: CurrentUser;
  onLogout: () => void;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  // จอแคบ (< sm): breadcrumb ลงแถวที่สองใต้แถบ — แถวบนเหลือปุ่มเมนู · กระดิ่ง · ผู้ใช้ (เดิมทับกัน — BACKLOG4 V5)
  return (
    <div className="shrink-0">
      <nav className="navbar">
        <button
          type="button"
          className="navbar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="menu"
        >
          <Bars3Icon />
        </button>

        <div className="hidden min-w-0 flex-1 sm:flex">
          <BreadcrumbTrail items={crumbs} />
        </div>
        <div className="flex-1 sm:hidden" />

        <div className="navbar-right">
          <NotificationDropdown />
          <div className="navbar-divider" />
          <UserMenuDropdown user={user} onLogout={onLogout} />
        </div>
      </nav>
      <div className="navbar-crumbs-row">
        <BreadcrumbTrail items={crumbs} />
      </div>
    </div>
  );
}
