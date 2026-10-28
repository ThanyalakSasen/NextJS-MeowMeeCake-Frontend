"use client";
// แท็บ "จัดการรีวิว" ของหน้ารายงานความคิดเห็น (BACKLOG4 E4) — แถบกรอง (dropdown 2 แถว) · แถบสรุปของชุดที่กรอง ·
// แท็บประเภทคำสั่งซื้อ (ทั้งหมด/สั่งซื้อปกติ/พรีออเดอร์) · การ์ดรีวิว · แบ่งหน้า (เอา modal แท็กภายใน + รายละเอียดออก 2026-10-26)
// หัวหน้า/แท็บ/ปุ่มตั้งค่าอยู่ที่ ReviewsReportView
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/i18n/format";
import { EmptyState } from "@/components/base";
import { PaginationBar, TypeTabBar } from "@/components/shared/data";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import type { ReviewFilters, useReviewsViewModel } from "./useReviewsViewModel";
import { ReviewFiltersBar } from "./_components/ReviewFiltersBar";
import { ReviewCard } from "./_components/ReviewCard";

type VM = ReturnType<typeof useReviewsViewModel>;

export function ReviewsView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();
  const s = vm.summary;

  return (
    <>
      <div className="flex flex-col gap-3">
        <ReviewFiltersBar
          filters={vm.filters}
          setFilter={vm.setFilter}
          search={vm.search}
          setSearch={vm.setSearch}
          onReset={vm.resetFilters}
          hasActiveFilters={vm.hasActiveFilters}
          categoryOptions={vm.categoryOptions}
          productOptions={vm.productOptions}
          aspectOptions={vm.aspectOptions}
        />

        {/* สรุปของชุดที่กรอง (ทุกหน้า ไม่ใช่แค่หน้านี้) */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-brown-100 bg-brown-50 px-4 py-2.5 text-sm text-brown-800">
          <span>{t("reviews.summary.count", { n: formatNumber(s?.count ?? 0, locale) })}</span>
          <span>{t("reviews.summary.avg", { v: s?.avg_rating != null ? s.avg_rating.toFixed(2) : "—" })}</span>
          <span className={(s?.negative_rate ?? 0) >= 0.25 ? "text-rose-700" : ""}>
            {t("reviews.summary.negative", { v: s?.negative_rate != null ? `${Math.round(s.negative_rate * 100)}%` : "—" })}
          </span>
          {(s?.unreplied_negative ?? 0) > 0 && (
            <button type="button" onClick={() => vm.showUnrepliedNegative()} className="font-semibold text-rose-700 hover:underline">
              {t("reviews.summary.unrepliedNegative", { n: s!.unreplied_negative })}
            </button>
          )}
        </div>

        {/* ประเภทคำสั่งซื้อ — แท็บชิดขวาเหนือรายการ (เดิมเป็น dropdown ในแถบกรอง) */}
        <div className="flex flex-wrap items-center justify-end gap-2 px-1">
          <TypeTabBar<ReviewFilters["orderKind"]>
            value={vm.filters.orderKind}
            onChange={(v) => vm.setFilter("orderKind", v)}
            options={[
              { value: "all", label: t("reviews.filter.allOrderKinds") },
              { value: "order", label: t("reviews.filter.order") },
              { value: "preorder", label: t("reviews.preorder") },
            ]}
          />
        </div>

        {vm.isError ? (
          <LoadFailed onRetry={vm.refetch} />
        ) : vm.isLoading ? (
          <LoadingSpin />
        ) : vm.rows.length === 0 ? (
          <EmptyState description={t("reviews.empty")} />
        ) : (
          <ul className={`m-0 flex list-none flex-col gap-2 p-0 transition-opacity ${vm.isFetching ? "opacity-60" : ""}`}>
            {vm.rows.map((r) => (
              <ReviewCard
                key={r._id}
                review={r}
                canUpdate={vm.perm.update}
                canDelete={vm.perm.delete}
                suggestions={vm.replySuggestions}
                onStatus={(st) => vm.onStatus(r, st)}
                onTogglePin={() => vm.onTogglePin(r)}
                onSaveReply={(text) => vm.onSaveReply(r, text)}
                onSaveNote={(text) => vm.onSaveNote(r, text)}
                onDelete={() => vm.onDelete(r._id)}
              />
            ))}
          </ul>
        )}

        <PaginationBar page={vm.page} pageSize={vm.pageSize} total={vm.total} onChange={vm.onPage} />
      </div>

    </>
  );
}
