"use client";
// ─────────────────────────────────────────────────────────────
// Sidebar — Logo + เมนูกรองตาม permission + logout
// active-state: findActiveHref (longest-prefix, boundary-safe) จาก @/constants/menu
// ใช้ CSS class จาก globals.css (.sidebar, .menu-item-*, .submenu-*)
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingBagIcon, PowerIcon } from "@heroicons/react/24/solid";
import { MENU_SECTIONS, findActiveHref, findActiveGroupKey } from "@/constants/menu";
import { useMenuAccess } from "@/context/PermissionsContext";
import { Logo } from "@/components/base";
import { MenuGroupItem } from "./MenuGroupItem";
import { MENU_ICONS } from "./menuIcons";

export function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const access = useMenuAccess();
  const navRef = useRef<HTMLElement>(null);

  const activeHref = useMemo(() => findActiveHref(pathname), [pathname]);

  // กรองเมนูตามสิทธิ์ — item/child ที่มี menuKey แต่ไม่มี view → ซ่อน · group ที่ child หมด → ซ่อน
  const sections = useMemo(() => {
    return MENU_SECTIONS.map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          if (item.children) {
            const children = item.children.filter((c) => !c.menuKey || !access || access[c.menuKey]?.view);
            return children.length ? { ...item, children } : null;
          }
          return !item.menuKey || !access || access[item.menuKey]?.view ? item : null;
        })
        .filter((i): i is NonNullable<typeof i> => i !== null),
    })).filter((s) => s.items.length > 0);
  }, [access]);

  const [openKey, setOpenKey] = useState<string | null>(() => findActiveGroupKey(pathname));

  // เปิดกลุ่มของหน้าปัจจุบันทุกครั้งที่นำทาง (ผ่าน breadcrumb / ลิงก์อื่น / router.push ก็ตาม)
  // toggle มือระหว่างนำทางยังอยู่ — effect ผูกกับ pathname ไม่ใช่ทุก render
  // (แนวเดียวกับ OwnerLayout.tsx ที่ปิด drawer ตาม pathname)
  useEffect(() => {
    const g = findActiveGroupKey(pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (g) setOpenKey(g);
  }, [pathname]);

  // เลื่อนเมนู active ให้อยู่ในสายตา (เมนูยาว/จอเตี้ย) — หลังกลุ่มกางแล้ว
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [activeHref, openKey]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header flex-col items-center py-4">
        <Logo size={60} />
        <p className="sidebar-brand-sub mt-2">{tc("appTagline")}</p>
      </div>

      <nav ref={navRef} className="sidebar-body" aria-label={tc("appName")}>
        {sections.map((section, si) => (
          <div key={section.labelKey}>
            {si > 0 && <div className="sidebar-divider" />}
            <p className="sidebar-section-label">{t(section.labelKey)}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {section.items.map((item) => {
                const Icon = MENU_ICONS[item.icon] ?? ShoppingBagIcon;
                if (item.children) {
                  const key = `${section.labelKey}.${item.labelKey}`;
                  return (
                    <MenuGroupItem
                      key={key}
                      labelKey={item.labelKey}
                      Icon={Icon}
                      items={item.children}
                      open={openKey === key}
                      activeHref={activeHref}
                      onToggle={() => setOpenKey((p) => (p === key ? null : key))}
                    />
                  );
                }
                const isActive = item.href != null && item.href === activeHref;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href ?? "#"}
                      className={`menu-item-link${isActive ? " active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="menu-icon" aria-hidden="true" />
                      <span className="menu-item-label">{t(item.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="logout-btn" onClick={onLogout}>
          <PowerIcon className="menu-icon" aria-hidden="true" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
