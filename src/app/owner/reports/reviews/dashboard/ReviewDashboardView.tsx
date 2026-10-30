"use client";
// แท็บ "แดชบอร์ด" ของหน้ารายงานความคิดเห็น — 3 ส่วน: ภาพรวม · ต้องทำตอนนี้ · เจาะลึกสาเหตุ (ดู ReviewDashboardView)
// (กราฟเป็นแถบ HTML แบบเดียวกับรายงานยอดขาย — ไม่มีไลบรารีกราฟ) · ข้อมูลจาก GET /admin/reviews/stats
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button, Card, EmptyState, Select } from "@/components/base";
import { PeriodSelector } from "@/components/shared/data";
import { InfoTip, LazyTooltip, LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { StatCard, StatCardsGrid, type StatCardStatus } from "@/components/shared/stats";
import { formatDate, formatNumber, formatPercent } from "@/i18n/format";
import type { ReviewRow } from "../reviewRow";
import type { useReviewDashboardViewModel } from "./useReviewDashboardViewModel";
import { MIN_REVIEWS_FOR_LOW, type ProductSortKey, type ProductStat, type ReviewStats } from "./reviewStats";
import type { ReviewStatsSummary } from "@/types/review";
import { actionIcon } from "@/components/shared/actions";

type VM = ReturnType<typeof useReviewDashboardViewModel>;

/** ตัวเลือกช่วงเวลา (PeriodSelector) — วางแถวเดียวกับแท็บของหน้า ผ่าน toolbar ของ TabbedPageLayout */
export function ReviewDashboardToolbar(vm: VM) {
  return <PeriodSelector period={vm.period} onPeriodChange={vm.setPeriod} date={vm.selectedDate} onDateChange={vm.setSelectedDate} />;
}

/**
 * onViewUnreplied = ไปแท็บจัดการรีวิว กรองรีวิวลบที่ยังไม่ตอบ
 * ปรับใหม่ให้อ่านง่าย (2026-10-26) — เรียงจากบนลงล่าง:
 *   1) กล่องสรุป 2 บรรทัด: ช่วงนี้เป็นยังไง + ต้องทำอะไร
 *   2) การ์ด 3 ใบ: จำนวนรีวิว · คะแนนเฉลี่ย · % รีวิวแย่ (เทียบช่วงก่อน + ป้ายดี/ควรระวัง/แย่) — เอาการ์ด "ตอบกลับแล้ว" ออก
 *   3) ต้องทำ: รีวิวแย่ที่ยังไม่ตอบ · สินค้าที่คะแนนตก
 *   4) ลูกค้าชม/ติเรื่องอะไร · สรุปตามหมวดหมู่สินค้า — วางคู่กัน หน้าตาแถวเดียวกัน (MetricRow)
 *   5) ลูกค้าให้กี่ดาว · โน้ตภายใน (แทน "หัวข้อที่ถูกติ เทียบช่วงก่อนหน้า")
 *   6) สินค้า: รีวิวมากสุด · คะแนนต่ำสุด · ตารางคะแนนรายสินค้า (กดหัวคอลัมน์เรียง · ชื่อสินค้าแสดงเต็ม)
 * กล่องสรุปบอกช่วงวันที่ + ขอบเขต (ทั้งร้าน/สินค้าเดียว) · "ข้อมูลในหน้านี้คืออะไร" กางอ่านได้
 * เอาออก: การ์ดตอบกลับแล้ว · ตารางหัวข้อที่ถูกติเทียบช่วงก่อน · หัวส่วนยาว ๆ (ข้อมูลซ้ำ/อ่านยาก)
 */
export function ReviewDashboardView({
  onViewUnreplied,
  onViewNotes,
  ...vm
}: VM & { onViewUnreplied: () => void; onViewNotes?: () => void }) {
  const t = useTranslations();
  const td = useTranslations("reviewsDashboard");
  const locale = useLocale();
  const s = vm.stats;

  return (
    <div className="flex flex-col gap-5">
      {/* เลือกสินค้า — อยู่ในเนื้อหา ไม่ใช่แถวแท็บ (แถวแท็บยาวเกินจะดันปุ่ม จัดการรีวิว|แดชบอร์ด ลงบรรทัดใหม่)
          อยู่นอกเงื่อนไข "ไม่มีรีวิว" — ล้างตัวกรองได้เสมอ · ชิดขวาเหมือนตัวกรองหน้าอื่น */}
      <div className="flex flex-wrap items-center justify-end gap-2">
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
          <Button icon={actionIcon("view")} onClick={() => vm.setProductId(undefined)}>{t("reviewsDashboard.viewAllProducts")}</Button>
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
          {/* 1) สรุปช่วงนี้ — อ่านบรรทัดเดียวรู้เรื่อง */}
          <div className="flex flex-col gap-1 rounded-xl border border-brown-100 bg-brown-50/60 px-4 py-3">
            <p className="m-0 text-base font-semibold text-brown-900">{overviewSentence(s, td)}</p>
            <p className={`m-0 text-sm font-medium ${pendingCount(s) ? "text-red-700" : "text-green-700"}`}>
              {actionSentence(s, dropping(s).length, td)}
            </p>
            <p className="m-0 text-xs text-gray-600">
              {t("reviewsDashboard.dataScope", {
                scope: vm.productId
                  ? t("reviewsDashboard.scopeProduct", { name: vm.productOptions.find((o) => o.value === vm.productId)?.label ?? "" })
                  : t("reviewsDashboard.scopeAll"),
                from: formatDate(vm.range[0].toDate(), locale),
                to: formatDate(vm.range[1].toDate(), locale),
              })}
            </p>
            {/* ดูสินค้าเดียว: หัวข้อที่ลูกค้าติบ่อยสุดของสินค้านี้ (ย้ายมาจากคอลัมน์ในตารางรายสินค้า) */}
            {vm.selectedProduct && (
              <p className="m-0 flex flex-wrap items-center gap-1.5 text-sm text-gray-700">
                <span className="font-medium">{t("reviewsDashboard.colTopIssue")}:</span>
                {vm.selectedProduct.top_issue ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    {t("reviewsDashboard.issueChip", { name: vm.selectedProduct.top_issue.name, n: vm.selectedProduct.top_issue.count })}
                  </span>
                ) : (
                  <span className="text-gray-500">{t("reviewsDashboard.noTopIssue")}</span>
                )}
              </p>
            )}
            {s.previous && (
              <p className="m-0 text-xs text-gray-500">
                {t("reviewsDashboard.comparedTo", {
                  from: formatDate(vm.prevRange[0].toDate(), locale),
                  to: formatDate(vm.prevRange[1].toDate(), locale),
                })}
              </p>
            )}
          </div>

          {/* 2) ตัวเลขหลัก */}
          <Kpis s={s} onViewUnreplied={onViewUnreplied} />

          {/* 3) ต้องทำ */}
          <div className={`grid grid-cols-1 gap-5 ${vm.productId ? "" : "lg:grid-cols-2"}`}>
            <NeedsReply s={s} onViewAll={onViewUnreplied} />
            {!vm.productId && <DroppingProducts s={s} onPick={vm.openProduct} />}
          </div>

          {/* 4) ลูกค้าชม/ติเรื่องอะไร · สรุปตามหมวดหมู่ — คู่กัน หน้าตาแถวเดียวกัน (ดูสินค้าเดียว = มีหมวดเดียว ไม่ต้องแสดงหมวด) */}
          <div className={`grid grid-cols-1 gap-5 ${vm.productId ? "" : "lg:grid-cols-2"}`}>
            <Aspects s={s} />
            {!vm.productId && <Categories s={s} />}
          </div>

          {/* 5) ลูกค้าให้กี่ดาว · โน้ตภายใน */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RatingDistribution s={s} />
            <InternalNotes
              notes={vm.notes}
              total={vm.notesTotal}
              loading={vm.notesLoading}
              error={vm.notesError}
              onViewAll={onViewNotes}
            />
          </div>

          {/* 6) รายสินค้า (ดูสินค้าเดียวอยู่ = ไม่ต้องมี) */}
          {!vm.productId && (
            <>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ProductList title={t("reviewsDashboard.topProducts")} hint={t("reviewsDashboard.topProductsHint")} items={s.topProducts} onPick={vm.openProduct} />
                <ProductList
                  title={t("reviewsDashboard.lowProducts")}
                  hint={t("reviewsDashboard.lowProductsHint", { n: MIN_REVIEWS_FOR_LOW })}
                  items={s.lowProducts}
                  warnBelow={3}
                  onPick={vm.openProduct}
                />
              </div>
              <ProductTable vm={vm} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

type TD = ReturnType<typeof useTranslations<"reviewsDashboard">>;

/** คะแนนเฉลี่ยลดลงตั้งแต่เท่านี้ (ดาว) = "สินค้าที่คะแนนตก" */
const DROP_THRESHOLD = 0.5;

/** สินค้าที่คะแนนเฉลี่ยลดลง ≥ DROP_THRESHOLD เทียบช่วงก่อนหน้า — ตกมากสุดก่อน */
function dropping(s: ReviewStats) {
  return s.products
    .filter((p) => p.avgDelta != null && p.avgDelta <= -DROP_THRESHOLD + 1e-9)
    .sort((a, b) => (a.avgDelta ?? 0) - (b.avgDelta ?? 0));
}

function overviewSentence(s: ReviewStats, t: TD): string {
  const base = t("overviewSentence", { n: s.total, avg: s.avg != null ? s.avg.toFixed(1) : "—" });
  const p = s.previous;
  if (!p || p.total === 0 || p.avg == null || s.avg == null) return base;
  const d = s.avg - p.avg;
  if (Math.abs(d) < 0.05) return `${base} ${t("overviewSame")}`;
  return `${base} ${t(d > 0 ? "overviewUp" : "overviewDown", { d: Math.abs(d).toFixed(1) })}`;
}

/** จำนวนงานค้าง: รีวิวแย่ที่ยังไม่ตอบ + สินค้าที่คะแนนตก */
const pendingCount = (s: ReviewStats) => s.unrepliedNegativeCount + dropping(s).length;

function actionSentence(s: ReviewStats, drops: number, t: TD): string {
  const parts: string[] = [];
  if (s.unrepliedNegativeCount) parts.push(t("actionUnreplied", { n: s.unrepliedNegativeCount }));
  if (drops) parts.push(t("actionDropping", { n: drops }));
  return parts.length ? t("actionSentence", { items: parts.join(" · ") }) : t("actionNone");
}

/** การ์ดของแต่ละส่วน — คำอธิบาย (hint) อยู่ในไอคอน ⓘ ข้างหัวข้อ ชี้/แตะแล้วขึ้น (แทนกล่อง "ข้อมูลในหน้านี้คืออะไร?" เดิม) */
function Section({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-1">
          <p className="m-0 text-sm font-semibold text-brown-900">{title}</p>
          {hint && <InfoTip text={hint} />}
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

/** ป้ายสถานะของการ์ด — เกณฑ์อยู่ที่เดียว (ⓘ ของแต่ละการ์ดบอกเกณฑ์เดียวกัน) */
export function kpiStatuses(
  s: Pick<ReviewStats, "total" | "avg" | "negative" | "unrepliedNegativeCount" | "previous">,
): Record<"total" | "avg" | "negative" | "replied", StatCardStatus> {
  const negRate = s.total ? s.negative / s.total : 0;
  const prevTotal = s.previous?.total ?? 0;
  return {
    // จำนวนรีวิว: ลดลงเกินครึ่งจากช่วงก่อน = แย่ · ลดลง = ควรระวัง
    total: prevTotal > 0 && s.total < prevTotal * 0.5 ? "bad" : prevTotal > 0 && s.total < prevTotal ? "warn" : "good",
    avg: s.avg == null ? "warn" : s.avg >= 4 ? "good" : s.avg >= 3.5 ? "warn" : "bad",
    negative: negRate <= 0.1 ? "good" : negRate <= 0.25 ? "warn" : "bad",
    // ตอบกลับ: วัดจากรีวิวแย่ที่ยังไม่ตอบ (รีวิวดีไม่ตอบก็ได้) — 0 = ดี · 1–4 = ควรระวัง · 5 ขึ้นไป = แย่
    replied: s.unrepliedNegativeCount === 0 ? "good" : s.unrepliedNegativeCount < 5 ? "warn" : "bad",
  };
}

const TONE_OF: Record<StatCardStatus, "up" | "warn" | "down"> = { good: "up", warn: "warn", bad: "down" };

function Kpis({ s }: { s: ReviewStats; onViewUnreplied?: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const pct = (n: number) => formatPercent(s.total ? (n / s.total) * 100 : 0, locale, 0);
  /** ส่วนต่างของสัดส่วน — หน่วย "จุด" (percentage point) */
  const points = (abs: number) => t("reviewsDashboard.points", { n: formatNumber(abs, locale, { maximumFractionDigits: 1 }) });
  const p: ReviewStatsSummary | null = s.previous;
  const st = kpiStatuses(s);
  const label = (x: StatCardStatus) => t(`reviewsDashboard.status.${x}`);
  return (
    <StatCardsGrid cols={3}>
      <StatCard
        wrapLabel
        label={t("reviewsDashboard.total")}
        info={t("reviewsDashboard.totalInfo")}
        value={formatNumber(s.total, locale)}
        sub={t("reviewsDashboard.withMedia", { n: formatNumber(s.with_media, locale) })}
        status={st.total}
        statusLabel={label(st.total)}
        extra={p && <VsPrev now={s.total} prev={p.total} prevTotal={p.total} higherIsBetter format={(n) => formatNumber(n, locale)} />}
      />
      <StatCard
        wrapLabel
        label={t("reviewsDashboard.avgRating")}
        info={t("reviewsDashboard.avgInfo")}
        value={`★ ${s.avg != null ? s.avg.toFixed(2) : "—"}`}
        sub={t("reviewsDashboard.ofFive")}
        tone={TONE_OF[st.avg]}
        status={st.avg}
        statusLabel={label(st.avg)}
        extra={p && <VsPrev now={s.avg} prev={p.avg} prevTotal={p.total} higherIsBetter format={(n) => n.toFixed(2)} />}
      />
      <StatCard
        wrapLabel
        label={t("reviewsDashboard.negativeRate")}
        info={t("reviewsDashboard.negativeInfo")}
        value={pct(s.negative)}
        sub={t("reviewsDashboard.negativeCount", { n: formatNumber(s.negative, locale) })}
        tone={TONE_OF[st.negative]}
        status={st.negative}
        statusLabel={label(st.negative)}
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
    </StatCardsGrid>
  );
}

/** สินค้าที่คะแนนเฉลี่ยลดลงตั้งแต่ 0.5 ดาวเทียบช่วงก่อนหน้า — กดแล้วเปิดแดชบอร์ดของสินค้านั้น */
function DroppingProducts({ s, onPick }: { s: ReviewStats; onPick: (id: string) => void }) {
  const t = useTranslations();
  const rows = dropping(s);
  return (
    <Section title={t("reviewsDashboard.dropping")} hint={t("reviewsDashboard.droppingHint", { d: DROP_THRESHOLD })}>
      {!s.previous || s.previous.total === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.vsPrevNone")}</p>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.droppingNone")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map((p) => (
            <li key={p.id} className="border-b border-gray-100 last:border-b-0">
              <button
                type="button"
                onClick={() => onPick(p.id)}
                className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-0 py-2 text-left hover:bg-brown-50"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-brown-800">{p.name || t("reviewsDashboard.unknownProduct")}</span>
                <span className="shrink-0 text-sm text-gray-600">
                  ★ {p.prev_avg?.toFixed(1)} → {p.avg.toFixed(1)}
                </span>
                <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  ▼ {Math.abs(p.avgDelta ?? 0).toFixed(1)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** กลุ่มความพอใจตามดาว — สีเดียวกันทั้งแถบสรุปและแถบรายดาว */
const RATING_GROUPS = [
  { key: "ratingGood", stars: [5, 4], bar: "bg-success", chip: "bg-green-50 text-green-700" },
  { key: "ratingMid", stars: [3], bar: "bg-amber-400", chip: "bg-amber-50 text-amber-700" },
  { key: "ratingBad", stars: [2, 1], bar: "bg-danger", chip: "bg-red-50 text-red-700" },
] as const;

/**
 * ลูกค้าให้กี่ดาว — อ่านจากบนลงล่าง: คะแนนเฉลี่ยตัวใหญ่ + ดาว → สัดส่วน พอใจ / เฉยๆ / ไม่พอใจ (แถบเดียว) →
 * จำนวนรายดาว (แถบยาวตามสัดส่วนของทั้งหมด · สีตามกลุ่ม · ตัวเลข + % อยู่ท้ายแถว)
 */
function RatingDistribution({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const locale = useLocale();
  const pct = (n: number) => (s.total ? (n / s.total) * 100 : 0);
  const groups = RATING_GROUPS.map((g) => ({ ...g, n: g.stars.reduce((sum, star) => sum + (s.ratingCounts[star - 1] ?? 0), 0) }));
  const avg = s.avg ?? 0;
  return (
    <Section title={t("reviewsDashboard.ratingDist")} hint={t("reviewsDashboard.ratingDistHint")}>
      {s.total === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.emptySection")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* คะแนนเฉลี่ย */}
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold leading-none text-brown-900">{avg.toFixed(1)}</span>
            <div className="flex flex-col gap-0.5">
              <Stars value={avg} />
              <span className="text-xs text-gray-500">{t("reviewsDashboard.ratingAvgOf", { n: formatNumber(s.total, locale) })}</span>
            </div>
          </div>

          {/* พอใจ / เฉยๆ / ไม่พอใจ */}
          <div className="flex flex-col gap-2">
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
              {groups.map((g) => (g.n ? <div key={g.key} className={`h-full ${g.bar}`} style={{ width: `${pct(g.n)}%` }} /> : null))}
            </div>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <span key={g.key} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${g.chip}`}>
                  {t(`reviewsDashboard.${g.key}`)} · {formatPercent(pct(g.n), locale, 0)}
                </span>
              ))}
            </div>
          </div>

          {/* รายดาว */}
          <ul className="m-0 flex list-none flex-col gap-2 border-t border-gray-100 p-0 pt-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = s.ratingCounts[star - 1] ?? 0;
              const g = RATING_GROUPS.find((x) => (x.stars as readonly number[]).includes(star))!;
              return (
                <li key={star} className="grid items-center gap-3" style={{ gridTemplateColumns: "48px 1fr 88px" }}>
                  <span className="flex items-center gap-1 text-sm text-gray-700" aria-label={t("reviewsDashboard.starsLabel", { n: star })}>
                    <span className="font-semibold">{star}</span>
                    <span className="text-amber-400" aria-hidden>
                      ★
                    </span>
                  </span>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${g.bar}`} style={{ width: n ? `${Math.max(pct(n), 2)}%` : 0 }} />
                  </div>
                  <span className="text-right text-sm text-gray-800">
                    <span className="font-semibold">{t("reviewsDashboard.reviewsN", { n: formatNumber(n, locale) })}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Section>
  );
}

/** ดาว 5 ดวง เติมตามคะแนน (ส่วนทศนิยมเติมบางส่วน) */
function Stars({ value }: { value: number }) {
  return (
    <span className="relative inline-block text-lg leading-none tracking-wider" aria-hidden>
      <span className="text-gray-200">★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden whitespace-nowrap text-amber-400"
        style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

/**
 * แถวเดียวกันของ "ลูกค้าชม/ติเรื่องอะไร" กับ "สรุปตามหมวดหมู่" — อ่านเหมือนกันทั้งสองกล่อง:
 *   บรรทัดบน: ชื่อ (เต็ม ไม่ตัด) · ป้ายตัวเลขชิดขวา   แถบ: ยาวตามสัดส่วนเทียบแถวที่มากสุด   บรรทัดล่าง (ถ้ามี): ป้ายเพิ่มเติม
 */
function MetricRow({ name, chips, bar, footer }: { name: string; chips: React.ReactNode; bar: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-1.5 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="min-w-0 flex-1 break-words font-medium text-gray-800">{name}</span>
        <span className="flex shrink-0 flex-wrap items-center gap-1.5">{chips}</span>
      </div>
      {bar}
      {footer && <div className="flex flex-wrap items-center gap-1.5 text-xs">{footer}</div>}
    </li>
  );
}

const CHIP = "rounded-full px-2 py-0.5 text-xs font-semibold";

function Aspects({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  // เรื่องที่ถูกติมากสุดก่อน (สิ่งที่ต้องแก้) แล้วตามด้วยเรื่องที่ถูกชม
  const rows = [...s.aspects]
    .filter((a) => a.positive + a.negative > 0)
    .sort((a, b) => b.negative - a.negative || b.positive - a.positive);
  const max = Math.max(...rows.map((a) => a.positive + a.negative), 1);
  return (
    <Section title={t("reviewsDashboard.aspects")} hint={t("reviewsDashboard.aspectsHint")}>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.emptySection")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((a) => (
            <MetricRow
              key={a.name}
              name={a.name}
              chips={
                <>
                  <span className={`${CHIP} bg-green-50 text-green-700`}>{t("reviewsDashboard.likedN", { n: a.positive })}</span>
                  <span className={`${CHIP} bg-red-50 text-red-700`}>{t("reviewsDashboard.improveN", { n: a.negative })}</span>
                </>
              }
              bar={
                // แถบเดียว: เขียว = ชม · แดง = ติ · ความยาวตามจำนวนครั้งที่ถูกพูดถึง
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${((a.positive + a.negative) / max) * 100}%` }}>
                    <div className="h-full bg-success" style={{ width: `${(a.positive / (a.positive + a.negative)) * 100}%` }} />
                    <div className="h-full flex-1 bg-danger" />
                  </div>
                </div>
              }
            />
          ))}
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
              <SortTh vm={vm} k="positiveRate" label={t("reviewsDashboard.colPositive")} className="w-28" />
              <SortTh vm={vm} k="negativeRate" label={t("reviewsDashboard.colNegative")} className="w-24" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} onClick={() => pick(p.id)} className="cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-brown-50">
                <td className="min-w-[10rem] py-2 pr-3">
                  {/* ชื่อสินค้าเต็ม (ขึ้นบรรทัดใหม่ได้) — ไม่ตัด … */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      pick(p.id);
                    }}
                    className="block w-full cursor-pointer break-words border-none bg-transparent p-0 text-left text-sm font-medium text-brown-800 hover:underline"
                  >
                    {p.name || t("reviewsDashboard.unknownProduct")}
                  </button>
                  {p.category_name && <span className="block break-words text-xs text-gray-500">{p.category_name}</span>}
                </td>
                <td className="py-2 text-right text-gray-800">{formatNumber(p.count, locale)}</td>
                <td className={`py-2 text-right font-medium ${p.avg < 3 ? "text-danger" : "text-gray-800"}`}>★ {p.avg.toFixed(1)}</td>
                <td className="py-2 text-right">
                  {p.avgDelta == null ? (
                    <LazyTooltip title={t("reviewsDashboard.vsPrevNone")}>
                      <span className="text-gray-500">—</span>
                    </LazyTooltip>
                  ) : Math.abs(p.avgDelta) < 0.05 ? (
                    <span className="text-gray-500">{t("reviewsDashboard.aspectTrendSame")}</span>
                  ) : (
                    <span className={`font-semibold ${p.avgDelta > 0 ? "text-green-700" : "text-red-600"}`}>
                      {p.avgDelta > 0 ? "▲" : "▼"} {Math.abs(p.avgDelta).toFixed(1)}
                    </span>
                  )}
                </td>
                <td className={`py-2 text-right ${p.positiveRate >= 75 ? "font-semibold text-green-700" : "text-gray-700"}`}>
                  {formatPercent(p.positiveRate, locale, 0)}
                </td>
                <td className={`py-2 text-right ${p.negativeRate >= 25 ? "font-semibold text-danger" : "text-gray-700"}`}>
                  {formatPercent(p.negativeRate, locale, 0)}
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
  return (
    <Section
      title={t("reviewsDashboard.needsReply")}
      hint={t("reviewsDashboard.needsReplyHint")}
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
      {s.unrepliedNegative.length === 0 && <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.needsReplyNone")}</p>}
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

/**
 * สรุปตามหมวดหมู่สินค้า — แถวหน้าตาเดียวกับ "ลูกค้าชม/ติเรื่องอะไร" (MetricRow):
 *   ป้าย: จำนวนรีวิว · ★ คะแนนเฉลี่ย (ต่ำกว่า 3 = แดง) · รีวิวดี · รีวิวแย่
 *   แถบ = จำนวนรีวิวเทียบหมวดที่มากสุด แบ่งสี ดี (เขียว) / กลาง (เทา) / แย่ (แดง) · บรรทัดล่าง = เรื่องที่ถูกชม และเรื่องที่ถูกติของหมวด
 */
function Categories({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const locale = useLocale();
  const rows = [...s.categories].sort((a, b) => b.count - a.count);
  const max = Math.max(...rows.map((c) => c.count), 1);
  return (
    <Section title={t("reviewsDashboard.categories")} hint={t("reviewsDashboard.categoriesHint")}>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.emptySection")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((c) => {
            const issues = c.aspects.filter((a) => a.negative > 0);
            const liked = c.liked_aspects ?? [];
            const positive = c.positive ?? 0;
            const low = c.avg < 3;
            return (
              <MetricRow
                key={c.id || c.name}
                name={c.name || t("reviewsDashboard.unknownCategory")}
                chips={
                  <>
                    <span className={`${CHIP} bg-brown-50 text-brown-700`}>{t("reviewsDashboard.reviewsN", { n: formatNumber(c.count, locale) })}</span>
                    <span className={`${CHIP} ${low ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>★ {c.avg.toFixed(1)}</span>
                    {positive > 0 && (
                      <span className={`${CHIP} bg-green-50 text-green-700`}>{t("reviewsDashboard.categoryPositive", { n: formatNumber(positive, locale) })}</span>
                    )}
                    {c.negative > 0 && (
                      <span className={`${CHIP} bg-red-50 text-red-700`}>{t("reviewsDashboard.categoryNegative", { n: formatNumber(c.negative, locale) })}</span>
                    )}
                  </>
                }
                bar={
                  // ดี (เขียว) · กลาง (เทา) · แย่ (แดง) — ความยาวรวมตามจำนวนรีวิวของหมวด
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${(c.count / max) * 100}%` }}>
                      <div className="h-full bg-success" style={{ width: `${(positive / c.count) * 100}%` }} />
                      <div className="h-full flex-1 bg-gray-300" />
                      <div className="h-full bg-danger" style={{ width: `${(c.negative / c.count) * 100}%` }} />
                    </div>
                  </div>
                }
                footer={
                  (liked.length > 0 || issues.length > 0) && (
                    <div className="flex w-full flex-col gap-1">
                      {liked.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-gray-500">{t("reviewsDashboard.categoryLiked")}</span>
                          {liked.map((a) => (
                            <span key={a.name} className="rounded-full border border-green-200 bg-white px-2 py-0.5 font-medium text-green-700">
                              {t("reviewsDashboard.issueChip", { name: a.name, n: a.positive })}
                            </span>
                          ))}
                        </div>
                      )}
                      {issues.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-gray-500">{t("reviewsDashboard.categoryIssues")}</span>
                          {issues.map((a) => (
                            <span key={a.name} className="rounded-full border border-red-200 bg-white px-2 py-0.5 font-medium text-red-700">
                              {t("reviewsDashboard.issueChip", { name: a.name, n: a.negative })}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
              />
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/** โน้ตภายในของรีวิวในช่วงนี้ (ล่าสุดก่อน) — สินค้า · ดาว · โน้ต · ผู้รีวิว/วันที่ · "ดูทั้งหมด" = ไปแท็บจัดการรีวิว */
function InternalNotes({
  notes,
  total,
  loading,
  error,
  onViewAll,
}: {
  notes: ReviewRow[];
  total: number;
  loading: boolean;
  error: boolean;
  onViewAll?: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <Section
      title={t("reviewsDashboard.notes", { n: formatNumber(total, locale) })}
      hint={t("reviewsDashboard.notesHint")}
      action={
        onViewAll && total > 0 ? (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-brown-700 hover:underline"
          >
            {t("reviewsDashboard.viewAll")}
          </button>
        ) : undefined
      }
    >
      {error ? (
        <p className="py-4 text-center text-sm text-red-600">{t("reviewsDashboard.notesFailed")}</p>
      ) : loading ? (
        <LoadingSpin className="py-6" />
      ) : notes.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.notesEmpty")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {notes.map((r) => (
            <li key={r._id} className="flex flex-col gap-1 border-b border-gray-100 py-2.5 last:border-b-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                <span className={`font-semibold ${r.rating <= 2 ? "text-danger" : "text-amber-500"}`}>{"★".repeat(Math.round(r.rating))}</span>
                <span className="min-w-0 flex-1 break-words font-medium text-brown-800">{r.productName || t("reviewsDashboard.unknownProduct")}</span>
              </div>
              <p className="m-0 whitespace-pre-line rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{r.internal_note?.text}</p>
              <p className="m-0 text-xs text-gray-500">
                {r.userName || t("reviews.customer")} · {formatDate(r.internal_note?.updated_at ?? r.created_at, locale)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** อันดับสินค้า 5 อันดับ — กดแล้วเปิดแดชบอร์ดของสินค้านั้น */
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
          {items.slice(0, 5).map((p, i) => (
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
