"use client";
// ยอดขายรายวัน (กราฟแท่ง) + แยกตามช่องทาง — presentational: ข้อมูล/ช่วงวันมาจาก useDashboardViewModel().sales
// แท่งเป็น <button> (โฟกัสด้วยคีย์บอร์ดได้ · aria-label บอกวัน ยอด จำนวนออเดอร์) ชี้/โฟกัส = กล่องรายละเอียดของวันนั้น
// วาดด้วย div ไม่ใช้ไลบรารีกราฟ — แท่งไม่เกิน 90 อัน ไม่ต้องโหลด JS เพิ่ม
// ไม่มีสิทธิ์ดูยอดแยกช่องทาง (channels = null) → กราฟกว้างเต็มแถว
import { useState } from "react";
import Link from "next/link";
import { Segmented } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { formatCurrency, formatDayMonth, formatNumber } from "@/i18n/format";
import type { RevenueChannel } from "@/services/reports";
import type { useDashboardViewModel } from "../useDashboardViewModel";
import { SALES_RANGES, axisMax, tickEvery, type SalesRange } from "../salesTrend";

type Sales = ReturnType<typeof useDashboardViewModel>["sales"];

const CHANNEL_COLOR: Record<RevenueChannel, string> = {
  preorder: "bg-brown-700",
  pos: "bg-brown-400",
  web: "bg-brown-200",
  other: "bg-gray-300",
};

export function SalesTrendSection(sales: Sales) {
  const withChannels = sales.channels !== null;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className={withChannels ? "lg:col-span-2" : "lg:col-span-3"}>
        <SalesChartCard {...sales} />
      </div>
      {withChannels && <ChannelCard {...sales} />}
    </div>
  );
}

function SalesChartCard(sales: Sales) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [active, setActive] = useState<number | null>(null);
  const { days, summary, range } = sales;
  const top = axisMax(Math.max(0, ...days.map((d) => d.revenue)));
  const every = tickEvery(range);
  const gap = range === 90 ? 1 : range === 30 ? 4 : 12;
  const hasSales = summary.total > 0;
  const tip = active !== null ? days[active] : null;
  const tipLeft = active !== null ? ((active + 0.5) / days.length) * 100 : 0;

  return (
    <section className="section-card flex h-full flex-col">
      <div className="section-card-header flex-wrap gap-3">
        <div>
          <h2 className="section-card-title">{t("salesTitle")}</h2>
          {!sales.isLoading && !sales.isError && (
            <p className="mt-0.5 text-sm text-gray-600">
              {t("salesSub", { total: formatCurrency(summary.total, locale), avg: formatCurrency(Math.round(summary.avg), locale) })}
            </p>
          )}
        </div>
        <Segmented<SalesRange>
          value={range}
          onChange={(v) => {
            setActive(null);
            sales.setRange(v);
          }}
          options={SALES_RANGES.map((n) => ({ value: n, label: t("salesRange", { n }) }))}
        />
      </div>

      <div className="flex-1 px-5 py-4">
        {sales.isError ? (
          <LoadFailed onRetry={sales.refetch} size="small" />
        ) : sales.isLoading ? (
          <LoadingSpin className="h-64" />
        ) : (
          <div className="flex gap-3">
            <div className="flex h-56 w-16 shrink-0 flex-col justify-between text-right text-xs text-gray-600" aria-hidden="true">
              <span className="-translate-y-1/2">{formatCurrency(top, locale)}</span>
              <span>{formatCurrency(top / 2, locale)}</span>
              <span className="translate-y-1/2">{formatCurrency(0, locale)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="relative h-56 border-b border-gray-200" role="group" aria-label={t("salesChartLabel")}>
                <div className="absolute inset-x-0 top-0 border-t border-gray-100" aria-hidden="true" />
                <div className="absolute inset-x-0 top-1/2 border-t border-gray-100" aria-hidden="true" />
                {!hasSales && (
                  <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-600">{t("salesEmpty")}</p>
                )}
                <div className="absolute inset-0 flex items-end" style={{ gap }} onMouseLeave={() => setActive(null)}>
                  {days.map((d, i) => (
                    <button
                      key={d.date}
                      type="button"
                      aria-label={t("salesBarLabel", {
                        date: formatDayMonth(d.date, locale, { withYear: true }),
                        amount: formatCurrency(d.revenue, locale),
                        n: formatNumber(d.orders, locale),
                      })}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      className="flex h-full min-w-0 flex-1 cursor-pointer items-end rounded-t focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown-600"
                    >
                      <span
                        className={`block w-full rounded-t ${i === active ? "bg-brown-700" : d.revenue > 0 ? "bg-brown-400" : "bg-gray-200"}`}
                        style={{ height: d.revenue > 0 ? `${(d.revenue / top) * 100}%` : 2 }}
                      />
                    </button>
                  ))}
                </div>
                {tip && (
                  <div
                    className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-brown-900 px-3 py-2 shadow-lg"
                    style={{
                      left: `${tipLeft}%`,
                      bottom: `calc(${(tip.revenue / top) * 100}% + 8px)`,
                      transform: `translateX(${tipLeft > 85 ? "-100%" : tipLeft < 15 ? "0" : "-50%"})`,
                    }}
                    aria-hidden="true"
                  >
                    <p className="m-0 text-xs text-brown-100">{formatDayMonth(tip.date, locale, { withYear: true })}</p>
                    <p className="m-0 text-base font-semibold text-white">{formatCurrency(tip.revenue, locale)}</p>
                    <p className="m-0 text-xs text-brown-100">{t("salesOrders", { n: formatNumber(tip.orders, locale) })}</p>
                  </div>
                )}
              </div>
              <div className="mt-1.5 flex text-xs text-gray-600" style={{ gap }} aria-hidden="true">
                {days.map((d, i) => (
                  <span key={d.date} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
                    {(days.length - 1 - i) % every === 0 ? formatDayMonth(d.date, locale) : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ChannelCard(sales: Sales) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const channels = sales.channels ?? [];
  const total = channels.reduce((s, c) => s + c.amount, 0);

  return (
    <section className="section-card flex h-full flex-col">
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">{t("channelsTitle")}</h2>
          <p className="mt-0.5 text-sm text-gray-600">{t("channelsSub", { n: sales.range })}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        {sales.channelsError ? (
          <LoadFailed onRetry={sales.refetchChannels} size="small" />
        ) : sales.channelsLoading ? (
          <LoadingSpin className="py-10" />
        ) : total === 0 ? (
          <p className="dashboard-widget-empty">{t("salesEmpty")}</p>
        ) : (
          <>
            <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
              {channels.map((c) =>
                c.amount > 0 ? <div key={c.key} className={CHANNEL_COLOR[c.key]} style={{ flex: `${c.amount} 1 0` }} /> : null,
              )}
            </div>
            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
              {channels.map((c) => (
                <li key={c.key} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-gray-800">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${CHANNEL_COLOR[c.key]}`} aria-hidden="true" />
                      {t(`channel.${c.key}`)}
                    </span>
                    <span className="text-sm font-semibold text-brown-900">{formatCurrency(c.amount, locale)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{t("salesOrders", { n: formatNumber(c.count, locale) })}</span>
                    <span>{formatNumber(c.percent, locale)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {sales.showFinanceLink && (
        <div className="section-card-footer">
          <Link href="/owner/finance/summary" className="section-card-link">
            {t("viewFinance")}
          </Link>
        </div>
      )}
    </section>
  );
}
