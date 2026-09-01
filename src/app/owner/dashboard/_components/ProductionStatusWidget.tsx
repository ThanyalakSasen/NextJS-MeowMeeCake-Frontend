"use client";
// สถานะการผลิต — presentational: ใบสั่งผลิตที่ยังไม่เสร็จ + StatusBadge
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { StatusBadge } from "@/components/shared/stats";
import { formatDate } from "@/i18n/format";
import type { DashboardProduction } from "@/types/dashboard";

export function ProductionStatusWidget({ items }: { items: DashboardProduction[] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <section className="section-card">
      <div className="section-card-header">
        <h2 className="section-card-title">{t("productionStatus")}</h2>
        <Link href="/owner/production?tab=status" className="section-card-link">
          {t("viewAll")} →
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-gray-600">{t("productionNone")}</p>
      ) : (
        <ul>
          {items.map((p) => (
            <li key={p._id} className="production-item">
              <div>
                <p className="production-item-name">{p.items_summary}</p>
                <p className="production-item-meta">
                  {p.production_no} · {t("productionDue", { date: formatDate(p.due_date, locale) })}
                </p>
              </div>
              <StatusBadge group="productionStatus" value={p.production_status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
