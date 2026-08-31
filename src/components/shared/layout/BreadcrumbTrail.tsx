"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import type { BreadcrumbItem } from "@/types";

/** แถว breadcrumb — labelKey ชี้ไป i18n namespace "nav" */
export function BreadcrumbTrail({ items }: { items: BreadcrumbItem[] }) {
  const t = useTranslations("nav");
  return (
    <ol className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={item.href ?? i} className="breadcrumb-item flex items-center gap-1.5">
            {i > 0 && <ChevronRightIcon className="breadcrumb-separator" aria-hidden="true" />}
            {isLast || !item.href ? (
              <span className="breadcrumb-current">{t(item.labelKey)}</span>
            ) : (
              <Link href={item.href} className="breadcrumb-link">
                {t(item.labelKey)}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
