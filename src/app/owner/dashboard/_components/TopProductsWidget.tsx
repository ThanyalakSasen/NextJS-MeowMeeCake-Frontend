"use client";
// สินค้าขายดี — presentational: อันดับ + แถบสัดส่วนยอดขายเดือนนี้
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency, formatNumber } from "@/i18n/format";
import type { DashboardTopProduct } from "@/types/dashboard";

export function TopProductsWidget({ products }: { products: DashboardTopProduct[] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <section className="section-card">
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">{t("topProducts")}</h2>
          <p className="mt-0.5 text-sm text-gray-600">{t("topProductsSub")}</p>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="px-5 py-8 text-center text-gray-600">{t("topProductsNone")}</p>
      ) : (
        <ul>
          {products.map((p, idx) => (
            <li key={p._id} className="product-item">
              <div className="product-item-row">
                <div className="flex items-center gap-2">
                  <span className="product-item-rank">{formatNumber(idx + 1, locale)}</span>
                  <span className="product-item-name">{p.product_name}</span>
                </div>
                <div className="text-right">
                  <span className="product-item-revenue">
                    {t("soldUnit", { n: formatNumber(p.sold_qty, locale) })}
                  </span>
                  <span className="product-item-count">{formatCurrency(p.revenue, locale)}</span>
                </div>
              </div>
              <div className="product-bar-bg">
                <div className="product-bar-fill" style={{ width: `${p.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
