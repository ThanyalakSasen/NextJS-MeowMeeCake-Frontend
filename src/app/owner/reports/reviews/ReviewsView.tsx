"use client";
// แท็บ "จัดการรีวิว" ของหน้ารายงานความคิดเห็น (BACKLOG4 E4) — แถบกรอง · แถบสรุปของชุดที่กรอง ·
// การ์ดรีวิว · แบ่งหน้า · modal แท็กภายใน · drawer รายละเอียด (ผลวิเคราะห์ความรู้สึก)
// หัวหน้า/แท็บ/ปุ่มตั้งค่าอยู่ที่ ReviewsReportView
import { Modal } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/i18n/format";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button, EmptyState, Select } from "@/components/base";
import { PaginationBar } from "@/components/shared/data";
import { DetailDrawer, LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { modalButtonIcons } from "@/components/shared/actions";
import type { useReviewsViewModel } from "./useReviewsViewModel";
import { ReviewFiltersBar, ReviewSortSelect } from "./_components/ReviewFiltersBar";
import { ReviewCard } from "./_components/ReviewCard";
import { ReviewDetailContent } from "./_components/ReviewDetailContent";

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
          productOptions={vm.productOptions}
          aspectOptions={vm.aspectOptions}
        />

        {/* สรุปของชุดที่กรอง (ทุกหน้า ไม่ใช่แค่หน้านี้) · การเรียงชิดขวา (แยกจากการ์ดตัวกรอง) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4 rounded-xl border border-brown-100 bg-brown-50 px-4 py-2.5 text-sm text-brown-800">
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
          {vm.perm.update && vm.unreadOnPage > 0 && (
            <Button size="small" icon={<CheckIcon className="h-4 w-4" />} loading={vm.markingRead} onClick={vm.onMarkPageRead}>
              {t("reviews.markPageRead", { n: vm.unreadOnPage })}
            </Button>
          )}
          <ReviewSortSelect value={vm.filters.sort} onChange={(v) => vm.setFilter("sort", v)} />
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
                onMarkRead={() => vm.onMarkRead(r)}
                onSaveReply={(text) => vm.onSaveReply(r, text)}
                onSaveNote={(text) => vm.onSaveNote(r, text)}
                onTags={() => vm.openTags(r)}
                onDetail={() => vm.openDetail(r)}
                onDelete={() => vm.onDelete(r._id)}
              />
            ))}
          </ul>
        )}

        <PaginationBar page={vm.page} pageSize={vm.pageSize} total={vm.total} onChange={vm.onPage} />
      </div>

      <Modal
        open={!!vm.tagTarget}
        title={t("reviews.tagsTitle", { product: vm.tagTarget?.productName || t("reviews.unknownProduct") })}
        onCancel={vm.closeTags}
        onOk={() => void vm.saveTags()}
        confirmLoading={vm.tagSaving}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        {...modalButtonIcons("save")}
        destroyOnHidden
      >
        <p className="m-0 mb-1 text-xs text-gray-500">{t("filterLabel.tags")}</p>
        <Select
          mode="tags"
          aria-label={t("filterLabel.tags")}
          value={vm.tagDraft}
          onChange={(v: string[]) => vm.setTagDraft(v)}
          options={vm.tagSuggestions.map((tag) => ({ value: tag, label: tag }))}
          placeholder={t("reviews.tagsPlaceholder")}
        />
        <p className="m-0 mt-2 text-xs text-gray-500">{t("reviews.tagsHint")}</p>
      </Modal>

      <DetailDrawer open={!!vm.detail} title={t("reviews.detailTitle")} onClose={vm.closeDetail}>
        {vm.detail && <ReviewDetailContent review={vm.detail} />}
      </DetailDrawer>
    </>
  );
}
