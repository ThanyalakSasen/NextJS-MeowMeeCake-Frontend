"use client";
// กลุ่มเมนูย่อ/ขยายใน Sidebar — active-state มาจาก activeHref (คำนวณจุดเดียวใน Sidebar)
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import type { MenuLeaf } from "@/constants/menu";
import type { NavKey } from "@/i18n/keys";
import { MENU_ICONS } from "./menuIcons";

export function MenuGroupItem({
  labelKey,
  Icon,
  items,
  open,
  activeHref,
  onToggle,
}: {
  labelKey: NavKey;
  Icon: React.ElementType;
  items: MenuLeaf[];
  open: boolean;
  /** href ของ leaf ที่ตรงกับหน้าปัจจุบัน (longest-prefix) หรือ null */
  activeHref: string | null;
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
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={`submenu-item-link${isActive ? " active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <LeafIcon className="submenu-icon" aria-hidden="true" />
                  {t(s.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
