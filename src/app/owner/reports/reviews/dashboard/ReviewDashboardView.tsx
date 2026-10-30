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
import type { useReviewDashboardViewModel } from "./useReviewDashboardViewModel";
import { MIN_REVIEWS_FOR_LOW, type ProductSortKey, type ProductStat, type ReviewStats } from "./reviewStats";
import type { ReviewStatsSummary } from "@/types/review";

type VM = ReturnType<typeof useReviewDashboardViewModel>;

/** ตัวเลือกช่วงเวลา (PeriodSelector) — วางแถวเดียวกับแท็บของหน้า ผ่าน toolbar ของ TabbedPageLayout */
export function ReviewDashboardToolbar(vm: VM) {
  return <PeriodSelector period={vm.period} onPeriodChange={vm.setPeriod} date={vm.selectedDate} onDateChange={vm.setSelectedDate} />;
}

/**
 * onViewUnreplied = ไปแท็บจัดการรีวิว กรองรีวิวลบที่ยังไม่ตอบ
 * ปรับใหม่ให้อ่านง่าย (2026-10-26) — เรียงจากบนลงล่าง:
 *   1) กล่องสรุป 2 บรรทัด: ช่วงนี้เป็นยังไง + ต้องทำอะไร
 *   2) การ์ด 4 ใบ: จำนวนรีวิว · คะแนนเฉลี่ย · % รีวิวแย่ · % ตอบกลับแล้ว (เทียบช่วงก่อน + ป้ายดี/ควรระวัง/แย่)
 *   3) ต้องทำ: รีวิวแย่ที่ยังไม่ตอบ · สินค้าที่คะแนนตก
 *   4) ลูกค้าพูดถึงอะไร: เรื่องที่ชม/ติ · ลูกค้าให้กี่ดาว
 *   5) แนวโน้มตามเวลา (จำนวนรีวิว + คะแนนเฉลี่ยแต่ละวัน/เดือน)
 *   6) สินค้า: รีวิวมากสุด · คะแนนต่ำสุด · ตารางคะแนนรายสินค้า (กดหัวคอลัมน์เรียง)
 * กล่องสรุปบอกช่วงวันที่ + ขอบเขต (ทั้งร้าน/สินค้าเดียว) · "ข้อมูลในหน้านี้คืออะไร" กางอ่านได้
 * เอาออก: สรุปตามหมวด · ตารางหัวข้อที่ถูกติเทียบช่วงก่อน · หัวส่วนยาว ๆ (ข้อมูลซ้ำ/อ่านยาก)
 */
export function ReviewDashboardView({
  onViewUnreplied,
  ...vm
}: VM & { onViewUnreplied: () => void }) {
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

          {/* 4) ลูกค้าพูดถึงอะไร */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Aspects s={s} />
            <RatingDistribution s={s} />
          </div>

          {/* 5) เจาะลึก: หัวข้อที่ถูกติเทียบช่วงก่อน · สรุปตามหมวดหมู่ (แทนกราฟแนวโน้มตามเวลา — ดูสินค้าเดียว = มีหมวดเดียว ไม่ต้องแสดง) */}
          <div className={`grid grid-cols-1 gap-5 ${vm.productId ? "" : "lg:grid-cols-2"}`}>
            <AspectTrends s={s} />
            {!vm.productId && <Categories s={s} />}
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

function Kpis({ s, onViewUnreplied }: { s: ReviewStats; onViewUnreplied: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const pct = (n: number) => formatPercent(s.total ? (n / s.total) * 100 : 0, locale, 0);
  /** ส่วนต่างของสัดส่วน — หน่วย "จุด" (percentage point) */
  const points = (abs: number) => t("reviewsDashboard.points", { n: formatNumber(abs, locale, { maximumFractionDigits: 1 }) });
  const p: ReviewStatsSummary | null = s.previous;
  const st = kpiStatuses(s);
  const label = (x: StatCardStatus) => t(`reviewsDashboard.status.${x}`);
  return (
    <StatCardsGrid cols={4}>
      <StatCard
        label={t("reviewsDashboard.total")}
        info={t("reviewsDashboard.totalInfo")}
        value={formatNumber(s.total, locale)}
        sub={t("reviewsDashboard.withMedia", { n: formatNumber(s.with_media, locale) })}
        status={st.total}
        statusLabel={label(st.total)}
        extra={p && <VsPrev now={s.total} prev={p.total} prevTotal={p.total} higherIsBetter format={(n) => formatNumber(n, locale)} />}
      />
      <StatCard
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
      {/* ตอบกลับแล้ว (แทน "ยังไม่ได้อ่าน") — มีรีวิวแย่รอตอบ = กดการ์ดไปตอบ */}
      <StatCard
        label={t("reviewsDashboard.replyRate")}
        info={t("reviewsDashboard.replyInfo")}
        value={pct(s.replied)}
        sub={
          s.unrepliedNegativeCount
            ? t("reviewsDashboard.replySubPending", { n: formatNumber(s.unrepliedNegativeCount, locale) })
            : t("reviewsDashboard.replySubDone", { n: formatNumber(s.replied, locale), total: formatNumber(s.total, locale) })
        }
        tone={TONE_OF[st.replied]}
        status={st.replied}
        statusLabel={label(st.replied)}
        onClick={s.unrepliedNegativeCount ? onViewUnreplied : undefined}
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
                    <span className="font-semibold">{formatNumber(n, locale)}</span>{" "}
                    <span className="text-xs text-gray-500">({formatPercent(pct(n), locale, 0)})</span>
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
            <li key={a.name} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium text-gray-800">{a.name}</span>
                <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                  {t("reviewsDashboard.likedN", { n: a.positive })}
                </span>
                <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {t("reviewsDashboard.improveN", { n: a.negative })}
                </span>
              </div>
              {/* แถบเดียว: เขียว = ชม · แดง = ติ · ความยาวตามจำนวนครั้งที่ถูกพูดถึง */}
              <div className="flex h-2 overflow-hidden rounded-full bg-gray-100" style={{ width: `${((a.positive + a.negative) / max) * 100}%` }}>
                <div className="h-full bg-success" style={{ width: `${(a.positive / (a.positive + a.negative)) * 100}%` }} />
                <div className="h-full flex-1 bg-danger" />
              </div>
            </li>
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
 * สรุปตามหมวดหมู่สินค้า (แทนกราฟแนวโน้มตามเวลา 2026-10-27) — จำนวนรีวิว · คะแนนเฉลี่ย · รีวิวแย่ · หัวข้อที่ถูกติบ่อยของหมวด
 * แถบ = สัดส่วนจำนวนรีวิวเทียบหมวดที่มากสุด · คะแนนเฉลี่ยต่ำกว่า 3 = สีแดง
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
            return (
              <li key={c.id || c.name} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800">{c.name || t("reviewsDashboard.unknownCategory")}</span>
                  <span className={`shrink-0 ${c.avg < 3 ? "text-danger" : "text-gray-600"}`}>
                    {t("reviewsDashboard.productStat", { n: formatNumber(c.count, locale), avg: c.avg.toFixed(1) })}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${c.avg < 3 ? "bg-danger" : "bg-brown-500"}`} style={{ width: `${(c.count / max) * 100}%` }} />
                </div>
                {(c.negative > 0 || issues.length > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {c.negative > 0 && <span className="text-gray-500">{t("reviewsDashboard.categoryNegative", { n: formatNumber(c.negative, locale) })}</span>}
                    {issues.map((a) => (
                      <span key={a.name} className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">
                        {t("reviewsDashboard.issueChip", { name: a.name, n: a.negative })}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/**
 * หัวข้อที่ถูกติ เทียบช่วงก่อนหน้า — เพิ่มขึ้นมากสุดก่อน
 * แต่ละหัวข้อ: บอกการเปลี่ยนแปลงเป็นคำ (ใหม่ · ไม่มีแล้ว · เพิ่ม/ลด กี่ครั้ง กี่ % · เท่าเดิม) + แถบเทียบ ช่วงก่อน (เทา) กับช่วงนี้ (แดง)
 */
function AspectTrends({ s }: { s: ReviewStats }) {
  const t = useTranslations();
  const locale = useLocale();
  const rows = s.aspectTrends;
  const max = Math.max(...(rows ?? []).flatMap((a) => [a.negative, a.prevNegative]), 1);
  const change = (a: NonNullable<ReviewStats["aspectTrends"]>[number]) => {
    if (a.delta === 0) return { tone: "text-gray-500", icon: "＝", text: t("reviewsDashboard.aspectTrendSameN", { n: a.negative }) };
    if (a.prevNegative === 0) return { tone: "text-danger", icon: "▲", text: t("reviewsDashboard.aspectTrendNew", { n: a.negative }) };
    if (a.negative === 0) return { tone: "text-green-700", icon: "▼", text: t("reviewsDashboard.aspectTrendGone", { n: a.prevNegative }) };
    const p = formatPercent((Math.abs(a.delta) / a.prevNegative) * 100, locale, 0);
    return a.delta > 0
      ? { tone: "text-danger", icon: "▲", text: t("reviewsDashboard.aspectTrendUp", { n: a.delta, pct: p }) }
      : { tone: "text-green-700", icon: "▼", text: t("reviewsDashboard.aspectTrendDown", { n: -a.delta, pct: p }) };
  };
  return (
    <Section title={t("reviewsDashboard.aspectTrend")} hint={t("reviewsDashboard.aspectTrendHint")}>
      {rows === null ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.vsPrevNone")}</p>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">{t("reviewsDashboard.aspectTrendEmpty")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((a) => {
            const c = change(a);
            return (
              <li key={a.name} className="flex flex-col gap-1.5 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800">{a.name}</span>
                  <span className={`shrink-0 text-right text-xs font-semibold ${c.tone}`}>
                    <span aria-hidden>{c.icon} </span>
                    {c.text}
                  </span>
                </div>
                {/* ช่วงก่อน vs ช่วงนี้ — ความยาวเทียบกับหัวข้อที่ถูกติมากสุดในตาราง */}
                <div className="grid items-center gap-x-2 gap-y-1 text-[11px] text-gray-500" style={{ gridTemplateColumns: "56px 1fr 24px" }}>
                  <span>{t("reviewsDashboard.aspectTrendPrev")}</span>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-gray-400" style={{ width: `${(a.prevNegative / max) * 100}%` }} />
                  </div>
                  <span className="text-right">{a.prevNegative}</span>
                  <span>{t("reviewsDashboard.aspectTrendNow")}</span>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-danger" style={{ width: `${(a.negative / max) * 100}%` }} />
                  </div>
                  <span className="text-right font-semibold text-gray-700">{a.negative}</span>
                </div>
              </li>
            );
          })}
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
