"use client";
// แท็บ "แดชบอร์ด" ของหน้ารายงานความคิดเห็น — ตัวเลขสรุป · การกระจายคะแนน · แนวโน้มตามเวลา · หัวข้อที่ชม/ควรปรับปรุง ·
// สินค้ารีวิวมาก/คะแนนต่ำ · รีวิวลบที่รอตอบ (กราฟเป็นแถบ HTML แบบเดียวกับรายงานยอดขาย — ไม่มีไลบรารีกราฟ)
import { Tooltip } from "antd";
import { useLocale, useTranslations } from "next-intl";
import type { Dayjs } from "dayjs";
import { Card, DatePicker, EmptyState } from "@/components/base";
import { TypeTabBar } from "@/components/shared/data";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { formatDate, formatNumber, formatPercent } from "@/i18n/format";
import { pickerTypeFor, PERIOD_TYPES, type PeriodType } from "@/utils/period";
import type { useReviewDashboardViewModel } from "./useReviewDashboardViewModel";
import { MIN_REVIEWS_FOR_LOW, type ProductStat, type ReviewStats } from "./reviewStats";

type VM = ReturnType<typeof useReviewDashboardViewModel>;

const PERIOD_LABEL_KEY: Record<PeriodType, "finance.periodDay" | "finance.periodWeek" | "finance.periodMonth" | "finance.periodQuarter" | "finance.periodYear"> = {
  day: "finance.periodDay",
  week: "finance.periodWeek",
  month: "finance.periodMonth",
  quarter: "finance.periodQuarter",
  year: "finance.periodYear",
};

/** onViewUnreplied = ไปแท็บจัดการรีวิว กรองรีวิวลบที่ยังไม่ตอบ */
export function ReviewDashboardView({ onViewUnreplied, ...vm }: VM & { onViewUnreplied: () => void }) {
  const t = useTranslations();
  const s = vm.stats;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <TypeTabBar
          value={vm.period}
          onChange={vm.setPeriod}
          options={PERIOD_TYPES.map((p) => ({ value: p, label: t(PERIOD_LABEL_KEY[p]) }))}
        />
        <DatePicker
          picker={pickerTypeFor(vm.period)}
          value={vm.selectedDate}
          onChange={(v) => { if (v && !Array.isArray(v)) vm.setSelectedDate(v); }}
          style={{ width: 180 }}
        />
      </div>

      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : vm.isLoading || !s ? (
        <LoadingSpin />
      ) : s.total === 0 ? (
        <Card className="p-6">
          <EmptyState description={t("reviewsDashboard.empty")} />
        </Card>
      ) : (
        <div className={`flex flex-col gap-5 transition-opacity ${vm.isFetching ? "opacity-60" : ""}`}>
          {vm.truncated && <p className="m-0 text-sm text-gray-500">{t("reviewsDashboard.truncated", { n: s.total })}</p>}
          <Kpis s={s} />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RatingDistribution s={s} />
            <Trend s={s} />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Aspects s={s} />
            <div className="flex flex-col gap-5">
              <ProductList title={t("reviewsDashboard.topProducts")} items={s.topProducts} />
              <ProductList
                title={t("reviewsDashboard.lowProducts")}
                hint={t("reviewsDashboard.lowProductsHint", { n: MIN_REVIEWS_FOR_LOW })}
                items={s.lowProducts}
                warnBelow={3}
              />
            </div>
          </div>
          <NeedsReply s={s} onViewAll={onViewUnreplied} />
        </div>
      )}
    </div>
  );
}

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold text-brown-900">{title}</p>
          {hint && <p className="m-0 text-xs text-gray-500">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </Card>
  );
}

function Kpis({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const locale = useLocale();
  const pct = (n: number) => formatPercent(s.total ? (n / s.total) * 100 : 0, locale, 0);
  const unrepliedNeg = s.unrepliedNegativeCount;
  return (
    <StatCardsGrid cols={5}>
      <StatCard
        label={t("reviewsDashboard.total")}
        value={formatNumber(s.total, locale)}
        sub={t("reviewsDashboard.withMedia", { n: formatNumber(s.withMedia, locale) })}
      />
      <StatCard
        label={t("reviewsDashboard.avgRating")}
        value={`★ ${s.avg != null ? s.avg.toFixed(2) : "—"}`}
        sub={t("reviewsDashboard.ofFive")}
        tone={s.avg != null && s.avg < 3.5 ? "down" : "up"}
      />
      <StatCard
        label={t("reviewsDashboard.negativeRate")}
        value={pct(s.negative)}
        sub={t("reviewsDashboard.negativeCount", { n: formatNumber(s.negative, locale) })}
        tone={s.total && s.negative / s.total >= 0.25 ? "down" : "muted"}
      />
      <StatCard
        label={t("reviewsDashboard.replyRate")}
        value={pct(s.replied)}
        sub={unrepliedNeg ? t("reviewsDashboard.unrepliedNegative", { n: unrepliedNeg }) : t("reviewsDashboard.allReplied")}
        tone={unrepliedNeg ? "warn" : "up"}
      />
      <StatCard label={t("reviewsDashboard.unread")} value={formatNumber(s.unread, locale)} tone={s.unread ? "warn" : "muted"} />
    </StatCardsGrid>
  );
}

function RatingDistribution({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const locale = useLocale();
  const max = Math.max(...s.ratingCounts, 1);
  return (
    <Section title={t("reviewsDashboard.ratingDist")}>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = s.ratingCounts[star - 1];
          const label = t("reviewsDashboard.countPct", {
            n: formatNumber(n, locale),
            pct: formatPercent(s.total ? (n / s.total) * 100 : 0, locale, 0),
          });
          return (
            <li key={star} className="grid items-center gap-3" style={{ gridTemplateColumns: "64px 1fr 96px" }}>
              <span className="text-sm text-gray-600">{t("reviewsDashboard.starsLabel", { n: star })}</span>
              <Tooltip title={`${t("reviewsDashboard.starsLabel", { n: star })}: ${label}`}>
                <div className="h-3.5 rounded bg-gray-100">
                  <div
                    className={`h-full rounded ${star <= 2 ? "bg-danger" : "bg-brown-500"}`}
                    style={{ width: n ? `${Math.max((n / max) * 100, 2)}%` : 0 }}
                  />
                </div>
              </Tooltip>
              <span className="text-right text-sm font-medium text-gray-800">{label}</span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Trend({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const locale = useLocale();
  const max = Math.max(...s.buckets.map((b) => b.count), 1);
  const monthFmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { month: "short", year: "numeric" });
  const labelOf = (d: Dayjs) => (s.bucketUnit === "day" ? formatDate(d.toDate(), locale) : monthFmt.format(d.toDate()));
  // ป้ายแกนแค่บางจุด (ไม่ให้ชนกัน) — ราว 6 ป้ายต่อกราฟ
  const step = Math.max(1, Math.ceil(s.buckets.length / 6));
  return (
    <Section title={t("reviewsDashboard.trend")}>
      <div className="flex h-40 items-end gap-[2px]">
        {s.buckets.map((b) => (
          <Tooltip
            key={b.key}
            title={t("reviewsDashboard.trendTip", { label: labelOf(b.start), n: b.count, avg: b.avg != null ? b.avg.toFixed(1) : "—" })}
          >
            {/* พื้นที่โฮเวอร์เต็มความสูง — แท่งเตี้ยก็ชี้โดน */}
            <div className="flex h-full min-w-0 flex-1 items-end hover:bg-brown-50">
              <div className="w-full rounded-t bg-brown-500" style={{ height: b.count ? `${Math.max((b.count / max) * 100, 3)}%` : 0 }} />
            </div>
          </Tooltip>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[2px] border-t border-gray-200 pt-1.5">
        {s.buckets.map((b, i) => (
          <span key={b.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-[11px] text-gray-500">
            {i % step === 0 ? labelOf(b.start) : ""}
          </span>
        ))}
      </div>
    </Section>
  );
}

function Aspects({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const max = Math.max(...s.aspects.map((a) => Math.max(a.positive, a.negative)), 1);
  return (
    <Section
      title={t("reviewsDashboard.aspects")}
      action={
        <div className="flex shrink-0 items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-danger" />
            {t("reviewsDashboard.improve")}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success" />
            {t("reviewsDashboard.liked")}
          </span>
        </div>
      }
    >
      {s.aspects.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.emptySection")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {s.aspects.map((a) => (
            <Tooltip key={a.name} title={t("reviewsDashboard.aspectTip", { name: a.name, pos: a.positive, neg: a.negative })}>
              {/* แถบสองข้างจากกลาง: ซ้าย = ควรปรับปรุง · ขวา = ชอบ */}
              <li className="grid items-center gap-2" style={{ gridTemplateColumns: "minmax(0,120px) 28px 1fr 1fr 28px" }}>
                <span className="truncate text-sm text-gray-700">{a.name}</span>
                <span className="text-right text-sm font-medium text-gray-800">{a.negative}</span>
                <div className="flex h-3.5 justify-end rounded-l bg-gray-100">
                  <div className="h-full rounded-l bg-danger" style={{ width: `${(a.negative / max) * 100}%` }} />
                </div>
                <div className="flex h-3.5 rounded-r bg-gray-100">
                  <div className="h-full rounded-r bg-success" style={{ width: `${(a.positive / max) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-800">{a.positive}</span>
              </li>
            </Tooltip>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ProductList({ title, hint, items, warnBelow }: { title: string; hint?: string; items: ProductStat[]; warnBelow?: number }) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <Section title={title} hint={hint}>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.emptySection")}</p>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 border-b border-gray-100 py-2 last:border-b-0">
              <span className="w-5 text-right text-sm text-gray-500">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-brown-800">{p.name || t("reviewsDashboard.unknownProduct")}</span>
              <span className={`shrink-0 text-sm ${warnBelow && p.avg < warnBelow ? "text-danger" : "text-gray-600"}`}>
                {t("reviewsDashboard.productStat", { n: formatNumber(p.count, locale), avg: p.avg.toFixed(1) })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

function NeedsReply({ s, onViewAll }: { s: ReviewStats; onViewAll: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  if (s.unrepliedNegative.length === 0) return null;
  return (
    <Section
      title={t("reviewsDashboard.needsReply")}
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-brown-700 hover:underline"
        >
          {t("reviewsDashboard.viewAll")}
        </button>
      }
    >
      <ul className="m-0 flex list-none flex-col p-0">
        {s.unrepliedNegative.map((r) => (
          <li key={r._id} className="flex flex-col gap-0.5 border-b border-gray-100 py-2.5 last:border-b-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
              <span className="font-semibold text-danger">{"★".repeat(Math.round(r.rating))}</span>
              <span className="font-medium text-brown-800">{r.productName || t("reviewsDashboard.unknownProduct")}</span>
              <span className="text-gray-500">{r.userName}</span>
              <span className="ml-auto text-xs text-gray-500">{formatDate(r.created_at, locale)}</span>
            </div>
            {r.review_text && <p className="m-0 line-clamp-2 text-sm text-gray-700">{r.review_text}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}
