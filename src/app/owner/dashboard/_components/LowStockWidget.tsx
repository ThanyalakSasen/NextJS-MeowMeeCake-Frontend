"use client";
// วัตถุดิบใกล้หมด — presentational: รายการ ingredient ที่ต่ำกว่าจุดสั่งซื้อ
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { formatNumber } from "@/i18n/format";
import type { DashboardLowStock } from "@/types/dashboard";

export function LowStockWidget({ items }: { items: DashboardLowStock[] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <section className="section-card">
      <div className="section-card-header">
        <h2 className="section-card-title">{t("lowStockTitle")}</h2>
        <span className="badge badge-danger">{t("lowStockCount", { n: items.length })}</span>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-gray-600">{t("lowStockNone")}</p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i._id} className="stock-item">
              <div>
                <p className="stock-item-name">{i.ingredient_name}</p>
                <p className="stock-item-threshold">
                  {t("lowStockMin", { n: i.reorder_point, unit: i.unit_abbr })}
                </p>
              </div>
              <span className="stock-item-value">
                {formatNumber(i.remaining, locale)} {i.unit_abbr}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="section-card-footer">
        <Link href="/owner/ingredients/ingredientStock" className="section-card-link">
          {t("manageIngredientStock")} →
        </Link>
      </div>
    </section>
  );
}
