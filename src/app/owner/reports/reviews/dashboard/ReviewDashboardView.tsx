"use client";
// แท็บ "แดชบอร์ด" ของหน้ารายงานความคิดเห็น — ออกแบบให้ "ดู 3 วิรู้เรื่อง": แบ่ง 3 โซน แต่ละโซนบอกว่าตอบคำถามอะไร
//   1) ภาพรวม       — การ์ดตัวเลข 4 ใบ + ป้ายสถานะ ดี / ควรระวัง / แย่ มุมบนขวา (+ เทียบช่วงก่อนหน้า)
//   2) ต้องทำตอนนี้  — รีวิวลบที่รอตอบ · สินค้าที่คะแนนตก (ขอบสี = งาน) · ไม่มีงาน = กล่องเขียว "เรียบร้อย"
//   3) เจาะลึกสาเหตุ — การกระจายคะแนน · หัวข้อที่ชม/ติ · สรุปรายหมวด · ตารางรายสินค้า
// ทุกส่วน: ไอคอน + ชื่อ + ⓘ (คำอธิบายเต็ม) + "ประโยคสรุป" ตัวหนาที่คำนวณจากข้อมูล — อ่านบรรทัดเดียวรู้ผล
// (กราฟเป็นแถบ HTML แบบเดียวกับรายงานยอดขาย — ไม่มีไลบรารีกราฟ) · ข้อมูลจาก GET /admin/reviews/stats
import { Tooltip } from "antd";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDownTrayIcon, ArrowTrendingDownIcon, ChatBubbleLeftEllipsisIcon, CheckCircleIcon, Squares2X2Icon, StarIcon, TableCellsIcon, TagIcon,
} from "@heroicons/react/24/outline";
import { Button, Card, DatePicker, EmptyState, Select } from "@/components/base";
import { TypeTabBar } from "@/components/shared/data";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { InfoTip, StatCard, StatCardsGrid } from "@/components/shared/stats";
import { formatDate, formatNumber, formatPercent } from "@/i18n/format";
import { pickerTypeFor, PERIOD_TYPES, type PeriodType } from "@/utils/period";
import type { useReviewDashboardViewModel } from "./useReviewDashboardViewModel";
import { DROP_ALERT_MIN_REVIEWS, DROP_ALERT_STARS, type ProductSortKey, type ReviewStats } from "./reviewStats";
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
export function ReviewDashboardView({ onViewUnreplied, onViewUnread, ...vm }: VM & { onViewUnreplied: () => void; onViewUnread: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const s = vm.stats;
  const showNeedsReply = !!s && s.unrepliedNegative.length > 0;
  const showDropped = !vm.productId && vm.droppedProducts.length > 0;

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
        <div className={`flex flex-col gap-8 transition-opacity ${vm.isFetching ? "opacity-60" : ""}`}>
          <Zone
            title={t("reviewsDashboard.zoneOverview")}
            question={t("reviewsDashboard.zoneOverviewQ")}
            note={
              s.previous
                ? t("reviewsDashboard.comparedTo", { from: formatDate(vm.prevRange[0].toDate(), locale), to: formatDate(vm.prevRange[1].toDate(), locale) })
                : undefined
            }
          >
            <Kpis s={s} onViewUnread={onViewUnread} />
          </Zone>

          <Zone title={t("reviewsDashboard.zoneTodo")} question={t("reviewsDashboard.zoneTodoQ")}>
            {showNeedsReply || showDropped ? (
              // คู่ซ้าย-ขวา (มีส่วนเดียว = เต็มความกว้าง) · ดูสินค้าเดียว = ไม่มี "สินค้าที่คะแนนตก" (การ์ดคะแนนเฉลี่ยบอกอยู่แล้ว)
              <div className={`grid grid-cols-1 items-start gap-5 ${showNeedsReply && showDropped ? "lg:grid-cols-2" : ""}`}>
                {showNeedsReply && <NeedsReply s={s} onViewAll={onViewUnreplied} />}
                {showDropped && <DroppedProducts vm={vm} />}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {t(vm.productId ? "reviewsDashboard.todoNoneProduct" : "reviewsDashboard.todoNone")}
              </div>
            )}
          </Zone>

          <Zone title={t("reviewsDashboard.zoneDeep")} question={t("reviewsDashboard.zoneDeepQ")}>
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
              <RatingDistribution s={s} />
              <Aspects s={s} />
            </div>
            {/* สินค้าเดียว — ไม่มีหมวด/ตารางรายสินค้า (มีแถวเดียว) */}
            {!vm.productId && (
              <>
                <Categories s={s} />
                <ProductTable vm={vm} />
              </>
            )}
          </Zone>
        </div>
      )}
    </div>
  );
}

/** โซนของแดชบอร์ด — ชื่อ + คำถามที่โซนนี้ตอบ (+ บรรทัดเสริม เช่น ช่วงที่เทียบ) */
function Zone({ title, question, note, children }: { title: string; question: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="m-0 text-base font-semibold text-brown-900">{title}</h2>
        <p className="m-0 text-sm text-gray-500">
          {question}
          {note && <span className="block text-xs">{note}</span>}
        </p>
      </div>
      {children}
    </section>
  );
}

type Accent = "danger" | "warn";
const ACCENT_CLS: Record<Accent, { border: string; icon: string }> = {
  danger: { border: "border-l-4 border-l-red-500", icon: "bg-red-50 text-red-600" },
  warn: { border: "border-l-4 border-l-amber-500", icon: "bg-amber-50 text-amber-700" },
};

/**
 * การ์ดของแต่ละส่วน — ไอคอน · ชื่อ · ⓘ (คำอธิบายเต็ม) · verdict = ประโยคสรุปตัวหนา (คำนวณจากข้อมูล)
 * accent = ส่วน "งานที่ต้องทำ" (ขอบซ้ายสี + ไอคอนสี) แยกจากส่วนวิเคราะห์
 */
function Section({
  icon: Icon,
  title,
  info,
  verdict,
  accent,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  info?: string;
  verdict?: React.ReactNode;
  accent?: Accent;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const a = accent ? ACCENT_CLS[accent] : null;
  return (
    <Card className={`overflow-hidden ${a?.border ?? ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a?.icon ?? "bg-brown-50 text-brown-700"}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-1 text-sm font-semibold text-brown-900">
              {title}
              {info && <InfoTip text={info} />}
            </p>
            {verdict && <p className="m-0 mt-0.5 text-sm font-medium text-gray-800">{verdict}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </Card>
  );
}

type Level = "good" | "watch" | "bad";
const LEVEL_CLS: Record<Level, string> = {
  good: "bg-green-50 text-green-700",
  watch: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
};
const LEVEL_TONE: Record<Level, "up" | "warn" | "down"> = { good: "up", watch: "warn", bad: "down" };
/** เกณฑ์ป้ายสถานะ — คะแนนเฉลี่ย: ดี ≥ 4.0 · ควรระวัง 3.5–3.9 · แย่ < 3.5 */
const avgLevel = (avg: number | null): Level | null => (avg == null ? null : avg >= 4 ? "good" : avg >= 3.5 ? "watch" : "bad");
/** % รีวิวเชิงลบ: ดี < 10% · ควรระวัง 10–24% · แย่ ≥ 25% */
const negLevel = (rate: number | null): Level | null => (rate == null ? null : rate < 10 ? "good" : rate < 25 ? "watch" : "bad");

function StatusPill({ level }: { level: Level }) {
  const t = useTranslations();
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${LEVEL_CLS[level]}`}>{t(`reviewsDashboard.level.${level}`)}</span>;
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

function Kpis({ s, onViewUnread }: { s: ReviewStats; onViewUnread: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const pct = (n: number) => formatPercent(s.total ? (n / s.total) * 100 : 0, locale, 0);
  /** ส่วนต่างของสัดส่วน — หน่วย "จุด" (percentage point) */
  const points = (abs: number) => t("reviewsDashboard.points", { n: formatNumber(abs, locale, { maximumFractionDigits: 1 }) });
  const p: ReviewStatsSummary | null = s.previous;
  const avgLv = avgLevel(s.avg);
  const negLv = negLevel(rateOf(s.negative, s.total));
  return (
    <StatCardsGrid cols={4}>
      <StatCard
        label={t("reviewsDashboard.total")}
        info={t("reviewsDashboard.totalInfo")}
        value={formatNumber(s.total, locale)}
        sub={t("reviewsDashboard.withMedia", { n: formatNumber(s.with_media, locale) })}
        extra={p && <VsPrev now={s.total} prev={p.total} prevTotal={p.total} higherIsBetter format={(n) => formatNumber(n, locale)} />}
      />
      <StatCard
        label={t("reviewsDashboard.avgRating")}
        info={t("reviewsDashboard.avgRatingInfo")}
        value={`★ ${s.avg != null ? s.avg.toFixed(2) : "—"}`}
        sub={t("reviewsDashboard.ofFive")}
        tone={avgLv ? LEVEL_TONE[avgLv] : "muted"}
        badge={avgLv && <StatusPill level={avgLv} />}
        extra={p && <VsPrev now={s.avg} prev={p.avg} prevTotal={p.total} higherIsBetter format={(n) => n.toFixed(2)} />}
      />
      <StatCard
        label={
          <span className="flex flex-col">
            <span>{t("reviewsDashboard.negativeRate")}</span>
            <span>{t("reviewsDashboard.negativeRateRange")}</span>
          </span>
        }
        info={t("reviewsDashboard.negativeRateInfo")}
        value={pct(s.negative)}
        sub={t("reviewsDashboard.negativeCount", { n: formatNumber(s.negative, locale) })}
        tone={negLv ? LEVEL_TONE[negLv] : "muted"}
        badge={negLv && <StatusPill level={negLv} />}
        extra={
          p && <VsPrev now={rateOf(s.negative, s.total)} prev={rateOf(p.negative, p.total)} prevTotal={p.total} higherIsBetter={false} format={points} />
        }
      />
      <StatCard
        label={t("reviewsDashboard.unread")}
        info={t("reviewsDashboard.unreadInfo")}
        value={formatNumber(s.unread, locale)}
        sub={s.unread ? undefined : t("reviewsDashboard.allRead")}
        tone={s.unread ? "warn" : "up"}
        extra={
          s.unread > 0 && (
            <button
              type="button"
              onClick={onViewUnread}
              className="mt-1 cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-brown-700 hover:underline"
            >
              {t("reviewsDashboard.viewUnread")}
            </button>
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
  // ดาวที่ได้มากสุด (เสมอ = ดาวสูงกว่า)
  const mode = [5, 4, 3, 2, 1].reduce((best, star) => (s.ratingCounts[star - 1] > s.ratingCounts[best - 1] ? star : best), 5);
  const modePct = formatPercent(s.total ? (s.ratingCounts[mode - 1] / s.total) * 100 : 0, locale, 0);
  return (
    <Section
      icon={StarIcon}
      title={t("reviewsDashboard.ratingDist")}
      info={t("reviewsDashboard.ratingDistHint")}
      verdict={
        <span className={mode <= 2 ? "text-red-700" : ""}>{t("reviewsDashboard.ratingVerdict", { n: mode, pct: modePct })}</span>
      }
    >
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

/** ส่วนต่าง "ถูกติ" เทียบช่วงก่อนหน้า — ติเพิ่ม = แดง ▲ · ติลด = เขียว ▼ */
function AspectDelta({ now, prev }: { now: number; prev: number }) {
  const t = useTranslations();
  const d = now - prev;
  return (
    <Tooltip title={t("reviewsDashboard.aspectDeltaTip", { now, prev })}>
      <span className={`text-right text-xs font-semibold ${d > 0 ? "text-red-600" : d < 0 ? "text-green-700" : "text-gray-500"}`}>
        {d > 0 ? `▲ ${d}` : d < 0 ? `▼ ${-d}` : "–"}
      </span>
    </Tooltip>
  );
}

/** หัวข้อที่ลูกค้าเลือกตอนรีวิว: ซ้าย = ติ · ขวา = ชม · คอลัมน์ท้าย = "ติ" เปลี่ยนไปเท่าไรจากช่วงก่อนหน้า */
function Aspects({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const max = Math.max(...s.aspects.map((a) => Math.max(a.positive, a.negative)), 1);
  const prev = s.prevAspectNegative;
  // ติมากสุดขึ้นก่อน — เห็นเรื่องที่ต้องแก้ทันที
  const rows = [...s.aspects].sort((a, b) => b.negative - a.negative || b.positive - a.positive);
  const cols = `minmax(0,120px) 28px 1fr 1fr 28px${prev ? " 40px" : ""}`;
  const topNeg = rows.find((a) => a.negative > 0);
  const topPos = [...s.aspects].sort((a, b) => b.positive - a.positive).find((a) => a.positive > 0);
  const verdict =
    topNeg || topPos ? (
      <span className="flex flex-wrap gap-x-3">
        {topNeg ? (
          <span className="text-red-700">{t("reviewsDashboard.aspectsTopNeg", { name: topNeg.name, n: topNeg.negative })}</span>
        ) : (
          <span className="text-green-700">{t("reviewsDashboard.aspectsNoNeg")}</span>
        )}
        {topPos && <span className="text-green-700">{t("reviewsDashboard.aspectsTopPos", { name: topPos.name, n: topPos.positive })}</span>}
      </span>
    ) : undefined;
  return (
    <Section
      icon={TagIcon}
      title={t("reviewsDashboard.aspects")}
      info={t(prev ? "reviewsDashboard.aspectsHintPrev" : "reviewsDashboard.aspectsHint")}
      verdict={verdict}
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
          {rows.map((a) => (
            // แถบสองข้างจากกลาง: ซ้าย = ควรปรับปรุง · ขวา = ชอบ
            <li key={a.name} className="grid items-center gap-2" style={{ gridTemplateColumns: cols }}>
              <span className="truncate text-sm text-gray-700">{a.name}</span>
              <span className="text-right text-sm font-medium text-gray-800">{a.negative}</span>
              <Tooltip title={t("reviewsDashboard.aspectTip", { name: a.name, pos: a.positive, neg: a.negative })}>
                <div className="flex h-3.5 justify-end rounded-l bg-gray-100">
                  <div className="h-full rounded-l bg-danger" style={{ width: `${(a.negative / max) * 100}%` }} />
                </div>
              </Tooltip>
              <Tooltip title={t("reviewsDashboard.aspectTip", { name: a.name, pos: a.positive, neg: a.negative })}>
                <div className="flex h-3.5 rounded-r bg-gray-100">
                  <div className="h-full rounded-r bg-success" style={{ width: `${(a.positive / max) * 100}%` }} />
                </div>
              </Tooltip>
              <span className="text-sm font-medium text-gray-800">{a.positive}</span>
              {prev && <AspectDelta now={a.negative} prev={prev.get(a.name) ?? 0} />}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** สรุปรายหมวดสินค้า + หัวข้อที่ถูกติมากสุดของหมวด */
function Categories({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const locale = useLocale();
  // หมวดคะแนนต่ำสุด (นับเฉพาะที่มีรีวิวอย่างน้อย DROP_ALERT_MIN_REVIEWS — รีวิวเดียวไม่ใช่ภาพรวม)
  const low = [...s.categories].filter((c) => c.count >= DROP_ALERT_MIN_REVIEWS).sort((a, b) => a.avg - b.avg)[0];
  return (
    <Section
      icon={Squares2X2Icon}
      title={t("reviewsDashboard.categories")}
      info={t("reviewsDashboard.categoriesHint")}
      verdict={
        low && (
          <span className={low.avg < 3.5 ? "text-red-700" : ""}>
            {t("reviewsDashboard.categoriesVerdict", { name: low.name || t("reviewsDashboard.unknownCategory"), avg: low.avg.toFixed(1) })}
          </span>
        )
      }
    >
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
      icon={TableCellsIcon}
      title={t("reviewsDashboard.productTable")}
      info={t("reviewsDashboard.productTableHint")}
      verdict={t("reviewsDashboard.productTableVerdict", { n: formatNumber(rows.length, locale) })}
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

/** แจ้งเตือนสินค้าที่คะแนนเฉลี่ยตกแรงจากช่วงก่อน — ไม่มีสินค้าเข้าเงื่อนไข = ไม่แสดงส่วนนี้ */
function DroppedProducts({ vm }: { vm: VM }) {
  const t = useTranslations();
  const locale = useLocale();
  const rows = vm.droppedProducts;
  if (rows.length === 0) return null;
  return (
    <Section
      icon={ArrowTrendingDownIcon}
      accent="warn"
      title={t("reviewsDashboard.dropped")}
      info={t("reviewsDashboard.droppedHint", { stars: DROP_ALERT_STARS, min: DROP_ALERT_MIN_REVIEWS })}
      verdict={<span className="text-amber-800">{t("reviewsDashboard.droppedVerdict", { n: rows.length, stars: DROP_ALERT_STARS })}</span>}
    >
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((p) => (
          <li key={p.id} className="border-b border-gray-100 last:border-b-0">
            <button
              type="button"
              onClick={() => vm.openProduct(p.id)}
              className="flex w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 border-none bg-transparent px-0 py-2.5 text-left hover:bg-brown-50"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-brown-800">{p.name || t("reviewsDashboard.unknownProduct")}</span>
              <span className="shrink-0 text-sm text-gray-600">
                {t("reviewsDashboard.droppedAvg", { prev: p.prev_avg!.toFixed(1), now: p.avg.toFixed(1) })}
              </span>
              <span className="shrink-0 text-sm font-semibold text-red-600">▼ {Math.abs(p.avgDelta!).toFixed(1)}</span>
              <span className="shrink-0 text-xs text-gray-500">{t("reviewsDashboard.droppedCount", { n: formatNumber(p.count, locale) })}</span>
              {p.top_issue && (
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  {t("reviewsDashboard.issueChip", { name: p.top_issue.name, n: p.top_issue.count })}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function NeedsReply({ s, onViewAll }: { s: ReviewStats; onViewAll: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  if (s.unrepliedNegative.length === 0) return null;
  return (
    <Section
      icon={ChatBubbleLeftEllipsisIcon}
      accent="danger"
      title={t("reviewsDashboard.needsReply")}
      info={t("reviewsDashboard.needsReplyHint", { n: s.unrepliedNegativeCount })}
      verdict={<span className="text-red-700">{t("reviewsDashboard.needsReplyVerdict", { n: formatNumber(s.unrepliedNegativeCount, locale) })}</span>}
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
