"use client";
// กลุ่มเมนูย่อ/ขยายใน Sidebar
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import type { MenuLeaf } from "@/constants/menu";
import type { NavKey } from "@/i18n/keys";

export function MenuGroupItem({
  labelKey,
  Icon,
  items,
  open,
  onToggle,
}: {
  labelKey: NavKey;
  Icon: React.ElementType;
  items: MenuLeaf[];
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const groupActive = items.some((s) => pathname.startsWith(s.href));

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
          {items.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className={`submenu-item-link${pathname === s.href ? " active" : ""}`}
              >
                <ChevronRightIcon className="submenu-chevron" aria-hidden="true" />
                {t(s.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
