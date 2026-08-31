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

  return (
    <nav className="navbar">
      <button
        type="button"
        className="navbar-toggle-btn lg:hidden"
        onClick={onToggleSidebar}
        aria-label="menu"
      >
        <Bars3Icon />
      </button>

      <BreadcrumbTrail items={crumbs} />

      <div className="navbar-right">
        <NotificationDropdown />
        <div className="navbar-divider" />
        <UserMenuDropdown user={user} onLogout={onLogout} />
      </div>
    </nav>
  );
}
