"use client";
// ─────────────────────────────────────────────────────────────
// Sidebar — Logo + เมนูกรองตาม permission + logout
// active-state: findActiveHref (longest-prefix, boundary-safe) จาก @/constants/menu
// เมนูย่อยแบบแท็บ (?tab=) ต้องรู้ query ด้วย — อ่าน useSearchParams ใต้ <Suspense> ของตัวเอง
// (layout ไม่ต้องอยู่ใต้ Suspense ทั้งก้อน · หน้า dynamic ไม่ suspend จริง · fallback = sidebar ที่ไม่รู้ query)
// ใช้ CSS class จาก globals.css (.sidebar, .menu-item-*, .submenu-*)
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";
import DoorLogoutIcon from "@/components/customer/DoorLogoutIcon";
import { MENU_SECTIONS, findActiveHref, findActiveGroupKey } from "@/constants/menu";
import { useMenuAccess } from "@/context/PermissionsContext";
import { Logo } from "@/components/base";
import { MenuGroupItem } from "./MenuGroupItem";
import { MENU_ICONS } from "./menuIcons";
import { ChatUnreadBadge } from "./ChatUnreadBadge";

/** จอที่ sidebar ตัว desktop แสดง — ตรงกับ `hidden lg:block` ใน OwnerLayout (Tailwind lg = 64rem) */
const DESKTOP_QUERY = "(min-width: 64rem)";

type SidebarProps = { onLogout?: () => void; inDrawer?: boolean };

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<SidebarView {...props} search={null} />}>
      <SidebarWithSearch {...props} />
    </Suspense>
  );
}

function SidebarWithSearch(props: SidebarProps) {
  const search = useSearchParams();
  return <SidebarView {...props} search={search} />;
}

function SidebarView({ onLogout, inDrawer = false, search }: SidebarProps & { search: URLSearchParams | null }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const access = useMenuAccess();
  const navRef = useRef<HTMLElement>(null);

  const activeHref = useMemo(() => findActiveHref(pathname, search), [pathname, search]);

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

  const [openKey, setOpenKey] = useState<string | null>(() => findActiveGroupKey(pathname, search));

  // เปิดกลุ่มของหน้าปัจจุบันทุกครั้งที่นำทาง (ผ่าน breadcrumb / ลิงก์อื่น / router.push ก็ตาม)
  // toggle มือระหว่างนำทางยังอยู่ — effect ผูกกับ pathname ไม่ใช่ทุก render
  // (แนวเดียวกับ OwnerLayout.tsx ที่ปิด drawer ตาม pathname)
  useEffect(() => {
    const g = findActiveGroupKey(pathname, search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (g) setOpenKey(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- เปิดกลุ่มเฉพาะตอนเปลี่ยนหน้า (สลับ ?tab= อยู่กลุ่มเดิมอยู่แล้ว)
  }, [pathname]);

  // เลื่อนเมนู active ให้อยู่ในสายตา (เมนูยาว/จอเตี้ย) — หลังกลุ่มกางแล้ว
  // ข้ามเมื่อ sidebar ไม่แสดง (ตัว desktop ต่ำกว่า lg เป็น display:none) — scrollIntoView บังคับคำนวณ style+layout
  // ทั้งหน้าทันทีระหว่าง hydrate (Lighthouse มือถือ ~100–150 ms ใน long task) ทั้งที่ไม่มีอะไรให้เลื่อน
  // เช็คด้วย matchMedia ไม่ใช่ DOM (checkVisibility ก็บังคับคำนวณ style ทั้งหน้าเหมือนกัน) · ตัวใน drawer สร้างตอนเปิดเท่านั้น
  useEffect(() => {
    if (!inDrawer && !window.matchMedia(DESKTOP_QUERY).matches) return;
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [activeHref, openKey, inDrawer]);

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
                      {item.menuKey === "chats" && <ChatUnreadBadge />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="logout-btn group" onClick={onLogout}>
          <DoorLogoutIcon className="menu-icon" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
