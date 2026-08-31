"use client";
// ─────────────────────────────────────────────────────────────
// Sidebar — Logo + เมนูกรองตาม permission + logout
// ใช้ CSS class จาก globals.css (.sidebar, .menu-item-*, .submenu-*)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  PresentationChartBarIcon, CurrencyDollarIcon, ShoppingBagIcon, ClipboardDocumentListIcon,
  BuildingStorefrontIcon, TagIcon, WrenchScrewdriverIcon, BeakerIcon, BookOpenIcon,
  UserGroupIcon, PaintBrushIcon, PowerIcon,
} from "@heroicons/react/24/solid";
import { MENU_SECTIONS } from "@/constants/menu";
import { useMenuAccess } from "@/context/PermissionsContext";
import { Logo } from "@/components/base";
import { MenuGroupItem } from "./MenuGroupItem";

const ICONS: Record<string, React.ElementType> = {
  PresentationChartBarIcon, CurrencyDollarIcon, ShoppingBagIcon, ClipboardDocumentListIcon,
  BuildingStorefrontIcon, TagIcon, WrenchScrewdriverIcon, BeakerIcon, BookOpenIcon,
  UserGroupIcon, PaintBrushIcon,
};

export function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const access = useMenuAccess();

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

  const [openKey, setOpenKey] = useState<string | null>(() => {
    for (const s of MENU_SECTIONS)
      for (const it of s.items)
        if (it.children?.some((c) => pathname.startsWith(c.href))) return `${s.labelKey}.${it.labelKey}`;
    return null;
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header flex-col items-center py-5">
        <Logo size={80} />
        <p className="sidebar-brand-sub mt-2">{tc("appTagline")}</p>
      </div>

      <nav className="sidebar-body" aria-label={tc("appName")}>
        {sections.map((section, si) => (
          <div key={section.labelKey}>
            {si > 0 && <div className="sidebar-divider" />}
            <p className="sidebar-section-label">{t(section.labelKey)}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {section.items.map((item) => {
                const Icon = ICONS[item.icon] ?? ShoppingBagIcon;
                if (item.children) {
                  const key = `${section.labelKey}.${item.labelKey}`;
                  return (
                    <MenuGroupItem
                      key={key}
                      labelKey={item.labelKey}
                      Icon={Icon}
                      items={item.children}
                      open={openKey === key}
                      onToggle={() => setOpenKey((p) => (p === key ? null : key))}
                    />
                  );
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href ?? "#"}
                      className={`menu-item-link${pathname === item.href ? " active" : ""}`}
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
