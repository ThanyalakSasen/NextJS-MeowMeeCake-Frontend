"use client";
// Drawer ของแท็บ "สรุปรอบ" (BACKLOG4 F4) — ยอดเงินแยกสถานะชำระ · จอง/โควตาต่อสินค้า · รายชื่อลูกค้าในรอบ
// (กรองสถานะชำระ/วิธีรับ · ค้นหาชื่อ เบอร์ อีเมล เลขพรีออเดอร์ · ส่งออก CSV) — presentational ล้วน
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button, ProgressBar, Select, Tag } from "@/components/base";
import { SearchInput } from "@/components/shared/data";
import { DetailDrawer } from "@/components/shared/feedback";
import { StatusBadge } from "@/components/shared/stats";
import { RetryButton } from "@/components/shared/actions";
import { formatCurrency } from "@/i18n/format";
import type { OrderType } from "@/types/order";
import { PAYMENT_GROUPS, type PaymentGroup } from "@/types/preorderRoundDashboard";
import { lineExtras, type useRoundDashboardViewModel } from "../useRoundDashboardViewModel";
import { PAYMENT_GROUP_CONFIG } from "@/constants/enumConfig";

type DVM = ReturnType<typeof useRoundDashboardViewModel>;

const GROUP_TONE: Record<PaymentGroup, string> = {
  paid: "border-green-200 bg-green-50 text-green-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  cancelled: "border-gray-200 bg-gray-50 text-gray-600",
};

export function RoundDashboardDrawer(vm: DVM) {
  const t = useTranslations();
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);
  const r = vm.selected;
  const data = vm.customers;

  return (
    <DetailDrawer open={!!r} title={r ? t("preorderRound.dashboard.drawerTitle", { name: r.round_name }) : ""} onClose={vm.closeRound} size={640}>
      {r && (
        <div className="flex flex-col gap-5">
          {/* ยอดเงินแยกสถานะชำระเงิน */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PAYMENT_GROUPS.map((g) => (
              <div key={g} className={`rounded-lg border px-3 py-2 ${GROUP_TONE[g]}`}>
                <p className="m-0 text-xs font-medium">{t(`preorderRound.dashboard.payment.${g}`)}</p>
                <p className="m-0 text-base font-bold">{money(r.payment[g].amount)}</p>
                <p className="m-0 text-xs">{t("preorderRound.dashboard.orderCount", { n: r.payment[g].count })}</p>
              </div>
            ))}
          </div>

          {/* จอง / โควตา ต่อสินค้า */}
          <section className="flex flex-col gap-2">
            <p className="m-0 text-sm font-semibold text-brown-800">{t("preorderRound.dashboard.productsTitle")}</p>
            {r.products.length === 0 ? (
              <p className="m-0 text-sm text-gray-500">{t("preorderRound.dashboard.noProducts")}</p>
            ) : (
              r.products.map((p) => (
                <div key={p.round_item_id} className="flex items-center gap-3">
                  <span className={`w-40 shrink-0 truncate text-sm ${p.is_active ? "text-gray-800" : "text-gray-500"}`} title={p.product_name_th}>
                    {p.product_name_th}
                  </span>
                  <div className="min-w-0 flex-1">
                    <ProgressBar percent={p.quota > 0 ? Math.round((p.ordered_qty / p.quota) * 100) : 0} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-sm text-gray-700">{p.ordered_qty}/{p.quota}</span>
                </div>
              ))
            )}
          </section>

          {/* รายชื่อลูกค้า */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-sm font-semibold text-brown-800">
                {data ? t("preorderRound.dashboard.customersTitle", { n: data.total_customers, orders: data.total_orders }) : t("preorderRound.dashboard.customersTitleShort")}
              </p>
              <Button size="small" icon={<ArrowDownTrayIcon className="h-4 w-4" />} disabled={!data?.customers.length} onClick={vm.onExportCustomers}>
                {t("preorderRound.dashboard.exportCsv")}
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <SearchInput value={vm.customerSearch} onChange={vm.setCustomerSearch} placeholder={t("preorderRound.dashboard.customerSearch")} className="sm:flex-1" />
              <Select
                className="sm:!w-40"
                value={vm.paymentFilter}
                onChange={(v) => vm.setPaymentFilter(v as PaymentGroup | "all")}
                aria-label={t("preorderRound.dashboard.filterPayment")}
                options={[
                  { value: "all", label: t("preorderRound.dashboard.allPayments") },
                  ...PAYMENT_GROUPS.map((g) => ({ value: g, label: t(`preorderRound.dashboard.payment.${g}`) })),
                ]}
              />
              <Select
                className="sm:!w-36"
                value={vm.typeFilter}
                onChange={(v) => vm.setTypeFilter(v as OrderType | "all")}
                aria-label={t("preorderRound.dashboard.filterType")}
                options={[
                  { value: "all", label: t("preorderRound.dashboard.allTypes") },
                  ...(["takeaway", "delivery"] as OrderType[]).map((o) => ({ value: o, label: t(`enums.orderType.${o}`) })),
                ]}
              />
            </div>

            {vm.isCustomersError ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <p className="m-0 text-gray-600">{t("common.loadFailed")}</p>
                <RetryButton size="small" onClick={vm.refetchCustomers} />
              </div>
            ) : vm.isCustomersLoading || !data ? (
              <p className="m-0 py-6 text-center text-gray-500">{t("common.loading")}</p>
            ) : data.customers.length === 0 ? (
              <p className="m-0 py-6 text-center text-gray-500">{t("preorderRound.dashboard.noCustomers")}</p>
            ) : (
              data.customers.map((c) => (
                <div key={c.user_id} className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="m-0 font-semibold text-brown-800">{c.user_fullname || "-"}</p>
                      <p className="m-0 break-all text-xs text-gray-500">{[c.user_phone, c.email].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="m-0 font-semibold text-brown-800">{money(c.total_spent)}</p>
                      <p className="m-0 text-xs text-gray-500">{t("preorderRound.dashboard.orderCount", { n: c.order_count })}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {c.orders.map((o) => (
                      <div key={o._id} className="flex flex-col gap-1 px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-800">{o.preorder_no}</span>
                          <Tag color={PAYMENT_GROUP_CONFIG[o.payment_group].antColor} className="!m-0">{t(`preorderRound.dashboard.payment.${o.payment_group}`)}</Tag>
                          <StatusBadge group="orderStatus" value={o.order_status} />
                          <span className="ml-auto font-medium text-gray-800">{money(o.total_amount)}</span>
                        </div>
                        <p className="m-0 text-xs text-gray-600">
                          {t(`enums.orderType.${o.order_type}`)}
                          {vm.receiveText(o) && ` · ${vm.receiveText(o)}`}
                        </p>
                        {o.items.map((l, i) => (
                          <div key={i} className="flex justify-between gap-3 pl-2 text-xs text-gray-600">
                            <span>
                              {l.product_name_th} ×{l.quantity}
                              {lineExtras(l).map((x) => (
                                <span key={x} className="block text-gray-500">{x}</span>
                              ))}
                            </span>
                            <span className="shrink-0">{money(l.total_price)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </DetailDrawer>
  );
}
