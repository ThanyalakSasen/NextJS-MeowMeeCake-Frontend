"use client";
// กลุ่มเมนูย่อ/ขยายใน Sidebar — active-state มาจาก activeHref (คำนวณจุดเดียวใน Sidebar)
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import type { MenuBadge, MenuLeaf } from "@/constants/menu";
import type { NavKey } from "@/i18n/keys";
import { MENU_ICONS } from "./menuIcons";

export function MenuGroupItem({
  labelKey,
  Icon,
  items,
  open,
  activeHref,
  badges,
  onToggle,
}: {
  labelKey: NavKey;
  Icon: React.ElementType;
  items: MenuLeaf[];
  open: boolean;
  /** href ของ leaf ที่ตรงกับหน้าปัจจุบัน (longest-prefix) หรือ null */
  activeHref: string | null;
  /** ตัวเลขท้ายเมนูย่อย (useMenuBadges) */
  badges?: Record<MenuBadge, number>;
  onToggle: () => void;
}) {
  const t = useTranslations("nav");
  const groupActive = items.some((s) => s.href === activeHref);

  return (
    <li>
      <button
        type="button"
        className={`menu-item-btn${groupActive ? " active" : ""}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <Icon className="menu-icon" aria-hidden="true" />
        <span className="menu-item-label">{t(labelKey)}</span>
        <ChevronDownIcon className={`menu-chevron${open ? " open" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <ul className="submenu-list">
          {items.map((s) => {
            const isActive = s.href === activeHref;
            const LeafIcon = MENU_ICONS[s.icon] ?? ChevronRightIcon;
            const badgeCount = s.badge && badges ? badges[s.badge] : 0;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={`submenu-item-link${isActive ? " active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <LeafIcon className="submenu-icon" aria-hidden="true" />
                  {t(s.labelKey)}
                  {badgeCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white" aria-label={t("unreadBadge", { n: badgeCount })}>
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
