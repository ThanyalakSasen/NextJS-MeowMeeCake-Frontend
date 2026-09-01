"use client";
// ออเดอร์ล่าสุด — presentational: รับ orders มา render ตาราง + StatusBadge
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { StatusBadge } from "@/components/shared/stats";
import { formatCurrency } from "@/i18n/format";
import type { DashboardRecentOrder } from "@/types/dashboard";

export function RecentOrdersWidget({ orders }: { orders: DashboardRecentOrder[] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <section className="section-card">
      <div className="section-card-header">
        <h2 className="section-card-title">{t("recentOrders")}</h2>
        <Link href="/owner/orders/manageOrders" className="section-card-link">
          {t("viewAll")} →
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="px-5 py-8 text-center text-gray-600">{t("noOrders")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("colOrder")}</th>
                <th>{t("colCustomer")}</th>
                <th>{t("colItems")}</th>
                <th>{t("colTotal")}</th>
                <th>{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="font-medium">{o.order_no}</td>
                  <td>{o.customer_name}</td>
                  <td className="max-w-[220px] truncate">{o.items_summary}</td>
                  <td>{formatCurrency(o.total_amount, locale)}</td>
                  <td>
                    <StatusBadge group="orderStatus" value={o.order_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
