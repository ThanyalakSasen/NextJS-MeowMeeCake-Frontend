"use client";
// แท็บ "แดชบอร์ด" ของหน้ารายงานความคิดเห็น — ตัวเลขสรุป (+ เทียบช่วงก่อนหน้า) · การกระจายคะแนน · แนวโน้มตามเวลา ·
// หัวข้อที่ชม/ควรปรับปรุง · หัวข้อที่ถูกติเทียบช่วงก่อนหน้า · สรุปรายหมวดสินค้า · สินค้ารีวิวมาก/คะแนนต่ำ · รีวิวลบที่รอตอบ
// (กราฟเป็นแถบ HTML แบบเดียวกับรายงานยอดขาย — ไม่มีไลบรารีกราฟ) · ข้อมูลจาก GET /admin/reviews/stats
import { Tooltip } from "antd";
import { useLocale, useTranslations } from "next-intl";
import type { Dayjs } from "dayjs";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button, Card, DatePicker, EmptyState, Select } from "@/components/base";
import { TypeTabBar } from "@/components/shared/data";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { formatDate, formatNumber, formatPercent } from "@/i18n/format";
import { pickerTypeFor, PERIOD_TYPES, type PeriodType } from "@/utils/period";
import type { useReviewDashboardViewModel } from "./useReviewDashboardViewModel";
import { MIN_REVIEWS_FOR_LOW, type ProductSortKey, type ProductStat, type ReviewStats } from "./reviewStats";
import type { ReviewStatsSummary } from "@/types/review";

type VM = ReturnType<typeof useReviewDashboardViewModel>;

const PERIOD_LABEL_KEY: Record<PeriodType, "finance.periodDay" | "finance.periodWeek" | "finance.periodMonth" | "finance.periodQuarter" | "finance.periodYear"> = {
  day: "finance.periodDay",
  week: "finance.periodWeek",
  month: "finance.periodMonth",
  quarter: "finance.periodQuarter",
  year: "finance.periodYear",
};

/** ตัวเลือกช่วงเวลา (รายวัน…รายปี + วันที่) — วางแถวเดียวกับแท็บของหน้า ผ่าน toolbar ของ TabbedPageLayout */
export function ReviewDashboardToolbar(vm: VM) {
  const t = useTranslations();
  return (
    <>
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
    </>
  );
}

/** onViewUnreplied = ไปแท็บจัดการรีวิว กรองรีวิวลบที่ยังไม่ตอบ */
export function ReviewDashboardView({ onViewUnreplied, ...vm }: VM & { onViewUnreplied: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const s = vm.stats;

  return (
    <div className="flex flex-col gap-5">
      {/* เลือกสินค้า — อยู่ในเนื้อหา ไม่ใช่แถวแท็บ (แถวแท็บยาวเกินจะดันปุ่ม จัดการรีวิว|แดชบอร์ด ลงบรรทัดใหม่)
          อยู่นอกเงื่อนไข "ไม่มีรีวิว" — ล้างตัวกรองได้เสมอ */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          value={vm.productId}
          options={vm.productOptions}
          placeholder={t("reviewsDashboard.productFilter")}
          aria-label={t("reviewsDashboard.productFilter")}
          onChange={(v?: string) => vm.setProductId(v)}
          style={{ width: 260 }}
        />
        {vm.productId && (
          <Button onClick={() => vm.setProductId(undefined)}>{t("reviewsDashboard.viewAllProducts")}</Button>
        )}
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
          {s.previous && (
            <p className="m-0 text-sm text-gray-500">
              {t("reviewsDashboard.comparedTo", {
                from: formatDate(vm.prevRange[0].toDate(), locale),
                to: formatDate(vm.prevRange[1].toDate(), locale),
              })}
            </p>
          )}
          <Kpis s={s} />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RatingDistribution s={s} />
            <Trend s={s} />
          </div>
          {vm.productId ? (
            // สินค้าเดียว — ไม่มีอันดับสินค้า/หมวด/ตารางรายสินค้า (มีแถวเดียว)
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Aspects s={s} />
              <AspectTrends s={s} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Aspects s={s} />
                <div className="flex flex-col gap-5">
                  <ProductList title={t("reviewsDashboard.topProducts")} items={s.topProducts} onPick={vm.openProduct} />
                  <ProductList
                    title={t("reviewsDashboard.lowProducts")}
                    hint={t("reviewsDashboard.lowProductsHint", { n: MIN_REVIEWS_FOR_LOW })}
                    items={s.lowProducts}
                    warnBelow={3}
                    onPick={vm.openProduct}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Categories s={s} />
                <AspectTrends s={s} />
              </div>
              <ProductTable vm={vm} />
            </>
          )}
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

/** สัดส่วน 0–100 · ไม่มีรีวิว = null */
const rateOf = (n: number, total: number) => (total ? (n / total) * 100 : null);

/**
 * บรรทัด "เทียบช่วงก่อนหน้า" ใต้ตัวเลข — ▲/▼ + ส่วนต่าง · สีตามว่าดีขึ้น (เขียว) หรือแย่ลง (แดง) ตาม higherIsBetter
 * ช่วงก่อนหน้าไม่มีรีวิว = ข้อความเทา · ส่วนต่างที่ปัดแล้วเป็น 0 = "เท่ากับช่วงก่อนหน้า"
 */
function VsPrev({
  now,
  prev,
  prevTotal,
  higherIsBetter,
  format,
}: {
  now: number | null;
  prev: number | null;
  prevTotal: number;
  higherIsBetter: boolean;
  format: (abs: number) => string;
}) {
  const t = useTranslations();
  if (prevTotal === 0) return <p className="m-0 mt-1 text-xs text-gray-500">{t("reviewsDashboard.vsPrevNone")}</p>;
  if (now == null || prev == null) return null;
  const diff = now - prev;
  if (format(Math.abs(diff)) === format(0)) {
    return <p className="m-0 mt-1 text-xs text-gray-500">{t("reviewsDashboard.vsPrevSame")}</p>;
  }
  const better = diff > 0 === higherIsBetter;
  return (
    <p className={`m-0 mt-1 text-xs font-medium ${better ? "text-green-700" : "text-red-600"}`}>
      {t("reviewsDashboard.vsPrev", { delta: `${diff > 0 ? "▲" : "▼"} ${format(Math.abs(diff))}` })}
    </p>
  );
}

function Kpis({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const locale = useLocale();
  const pct = (n: number) => formatPercent(s.total ? (n / s.total) * 100 : 0, locale, 0);
  /** ส่วนต่างของสัดส่วน — หน่วย "จุด" (percentage point) */
  const points = (abs: number) => t("reviewsDashboard.points", { n: formatNumber(abs, locale, { maximumFractionDigits: 1 }) });
  const unrepliedNeg = s.unrepliedNegativeCount;
  const p: ReviewStatsSummary | null = s.previous;
  return (
    <StatCardsGrid cols={4}>
      <StatCard
        label={t("reviewsDashboard.total")}
        value={formatNumber(s.total, locale)}
        sub={t("reviewsDashboard.withMedia", { n: formatNumber(s.with_media, locale) })}
        extra={p && <VsPrev now={s.total} prev={p.total} prevTotal={p.total} higherIsBetter format={(n) => formatNumber(n, locale)} />}
      />
      <StatCard
        label={t("reviewsDashboard.avgRating")}
        value={`★ ${s.avg != null ? s.avg.toFixed(2) : "—"}`}
        sub={t("reviewsDashboard.ofFive")}
        tone={s.avg != null && s.avg < 3.5 ? "down" : "up"}
        extra={p && <VsPrev now={s.avg} prev={p.avg} prevTotal={p.total} higherIsBetter format={(n) => n.toFixed(2)} />}
      />
      <StatCard
        label={t("reviewsDashboard.negativeRate")}
        value={pct(s.negative)}
        sub={t("reviewsDashboard.negativeCount", { n: formatNumber(s.negative, locale) })}
        tone={s.total && s.negative / s.total >= 0.25 ? "down" : "muted"}
        extra={
          p && (
            <VsPrev
              now={rateOf(s.negative, s.total)}
              prev={rateOf(p.negative, p.total)}
              prevTotal={p.total}
              higherIsBetter={false}
              format={points}
            />
          )
        }
      />
      <StatCard
        label={t("reviewsDashboard.replyRate")}
        value={pct(s.replied)}
        sub={unrepliedNeg ? t("reviewsDashboard.unrepliedNegative", { n: unrepliedNeg }) : t("reviewsDashboard.allReplied")}
        tone={unrepliedNeg ? "warn" : "up"}
        extra={
          p && (
            <VsPrev now={rateOf(s.replied, s.total)} prev={rateOf(p.replied, p.total)} prevTotal={p.total} higherIsBetter format={points} />
          )
        }
      />
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

/** onPick = กดสินค้าแล้วเปิดแดชบอร์ดของสินค้านั้น (เหมือนตาราง "วิเคราะห์รายสินค้า") */
function ProductList({
  title,
  hint,
  items,
  warnBelow,
  onPick,
}: {
  title: string;
  hint?: string;
  items: ProductStat[];
  warnBelow?: number;
  onPick: (id: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <Section title={title} hint={hint}>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.emptySection")}</p>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {items.map((p, i) => (
            <li key={p.id} className="border-b border-gray-100 last:border-b-0">
              <button
                type="button"
                onClick={() => onPick(p.id)}
                className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-0 py-2 text-left hover:bg-brown-50"
              >
                <span className="w-5 text-right text-sm text-gray-500">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-brown-800">{p.name || t("reviewsDashboard.unknownProduct")}</span>
                <span className={`shrink-0 text-sm ${warnBelow && p.avg < warnBelow ? "text-danger" : "text-gray-600"}`}>
                  {t("reviewsDashboard.productStat", { n: formatNumber(p.count, locale), avg: p.avg.toFixed(1) })}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

/** สรุปรายหมวดสินค้า + หัวข้อที่ถูกติมากสุดของหมวด */
function Categories({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <Section title={t("reviewsDashboard.categories")} hint={t("reviewsDashboard.categoriesHint")}>
      {s.categories.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.emptySection")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {s.categories.map((c) => {
            const issues = c.aspects.filter((a) => a.negative > 0);
            return (
              <li key={c.id} className="flex flex-col gap-1.5 border-b border-gray-100 py-2.5 last:border-b-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-brown-800">
                    {c.name || t("reviewsDashboard.unknownCategory")}
                  </span>
                  <span className={`shrink-0 text-sm ${c.avg < 3 ? "text-danger" : "text-gray-600"}`}>
                    {t("reviewsDashboard.productStat", { n: formatNumber(c.count, locale), avg: c.avg.toFixed(1) })}
                  </span>
                  {c.negative > 0 && (
                    <span className="shrink-0 text-sm font-medium text-danger">
                      {t("reviewsDashboard.categoryNegative", { n: formatNumber(c.negative, locale) })}
                    </span>
                  )}
                </div>
                {issues.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {issues.map((a) => (
                      <span key={a.name} className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        {t("reviewsDashboard.issueChip", { name: a.name, n: a.negative })}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-xs text-gray-500">{t("reviewsDashboard.noIssues")}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/** หัวข้อที่ถูกติ ช่วงนี้เทียบช่วงก่อนหน้า — เพิ่มขึ้นมากสุดก่อน */
function AspectTrends({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const rows = s.aspectTrends;
  if (!rows) return null;
  return (
    <Section title={t("reviewsDashboard.aspectTrend")} hint={t("reviewsDashboard.aspectTrendHint")}>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.aspectTrendEmpty")}</p>
      ) : (
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-1.5 font-medium">{t("reviewsDashboard.aspectTrendTopic")}</th>
              <th className="w-16 py-1.5 text-right font-medium">{t("reviewsDashboard.aspectTrendNow")}</th>
              <th className="w-16 py-1.5 text-right font-medium">{t("reviewsDashboard.aspectTrendPrev")}</th>
              <th className="w-24 py-1.5 text-right font-medium">{t("reviewsDashboard.aspectTrendChange")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.name} className="border-t border-gray-100">
                <td className="truncate py-2 text-gray-700">{a.name}</td>
                <td className="py-2 text-right font-medium text-gray-800">{a.negative}</td>
                <td className="py-2 text-right text-gray-600">{a.prevNegative}</td>
                <td
                  className={`py-2 text-right font-semibold ${
                    a.delta > 0 ? "text-red-600" : a.delta < 0 ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {a.delta > 0 ? `▲ ${a.delta}` : a.delta < 0 ? `▼ ${-a.delta}` : t("reviewsDashboard.aspectTrendSame")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

/** หัวคอลัมน์ที่กดเรียงได้ — aria-sort บอก screen reader · ลูกศรบอกทิศ */
function SortTh({ vm, k, label, align = "right", className = "" }: { vm: VM; k: ProductSortKey; label: string; align?: "left" | "right"; className?: string }) {
  const active = vm.sort.key === k;
  return (
    <th
      aria-sort={active ? (vm.sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`sticky top-0 z-10 bg-white py-2 font-medium ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      <button
        type="button"
        onClick={() => vm.onSort(k)}
        className={`inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs ${active ? "font-semibold text-brown-800" : "text-gray-500 hover:text-brown-700"}`}
      >
        {label}
        <span aria-hidden className={active ? "" : "opacity-30"}>
          {active && vm.sort.dir === "asc" ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}

/** ตาราง "วิเคราะห์รายสินค้า" — ทุกสินค้าที่มีรีวิวในช่วงนี้ · กดหัวคอลัมน์เรียง · กดสินค้า = แดชบอร์ดของสินค้านั้น */
function ProductTable({ vm }: { vm: VM }) {
  const t = useTranslations();
  const locale = useLocale();
  const rows = vm.productRows;
  if (rows.length === 0) return null;
  const pick = vm.openProduct;
  return (
    <Section
      title={t("reviewsDashboard.productTable")}
      hint={t("reviewsDashboard.productTableHint")}
      action={
        <Button size="small" icon={<ArrowDownTrayIcon className="h-4 w-4" />} onClick={vm.onExportProducts}>
          {t("reviews.exportCsv")}
        </Button>
      }
    >
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <SortTh vm={vm} k="name" label={t("reviewsDashboard.colProduct")} align="left" />
              <SortTh vm={vm} k="count" label={t("reviewsDashboard.colReviews")} className="w-20" />
              <SortTh vm={vm} k="avg" label={t("reviewsDashboard.colAvg")} className="w-20" />
              <SortTh vm={vm} k="avgDelta" label={t("reviewsDashboard.colAvgDelta")} className="w-28" />
              <SortTh vm={vm} k="negativeRate" label={t("reviewsDashboard.colNegative")} className="w-24" />
              <th className="sticky top-0 z-10 w-40 bg-white py-2 pl-3 text-left text-xs font-medium text-gray-500">
                {t("reviewsDashboard.colTopIssue")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} onClick={() => pick(p.id)} className="cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-brown-50">
                <td className="max-w-0 py-2 pr-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      pick(p.id);
                    }}
                    className="block w-full cursor-pointer truncate border-none bg-transparent p-0 text-left text-sm font-medium text-brown-800 hover:underline"
                  >
                    {p.name || t("reviewsDashboard.unknownProduct")}
                  </button>
                  {p.category_name && <span className="block truncate text-xs text-gray-500">{p.category_name}</span>}
                </td>
                <td className="py-2 text-right text-gray-800">{formatNumber(p.count, locale)}</td>
                <td className={`py-2 text-right font-medium ${p.avg < 3 ? "text-danger" : "text-gray-800"}`}>★ {p.avg.toFixed(1)}</td>
                <td className="py-2 text-right">
                  {p.avgDelta == null ? (
                    <Tooltip title={t("reviewsDashboard.vsPrevNone")}>
                      <span className="text-gray-500">—</span>
                    </Tooltip>
                  ) : Math.abs(p.avgDelta) < 0.05 ? (
                    <span className="text-gray-500">{t("reviewsDashboard.aspectTrendSame")}</span>
                  ) : (
                    <span className={`font-semibold ${p.avgDelta > 0 ? "text-green-700" : "text-red-600"}`}>
                      {p.avgDelta > 0 ? "▲" : "▼"} {Math.abs(p.avgDelta).toFixed(1)}
                    </span>
                  )}
                </td>
                <td className={`py-2 text-right ${p.negativeRate >= 25 ? "font-semibold text-danger" : "text-gray-700"}`}>
                  {formatPercent(p.negativeRate, locale, 0)}
                </td>
                <td className="max-w-0 py-2 pl-3">
                  {p.top_issue ? (
                    <span className="inline-block max-w-full truncate rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      {t("reviewsDashboard.issueChip", { name: p.top_issue.name, n: p.top_issue.count })}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
