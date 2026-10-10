"use client";
// View ของ "รีวิวลูกค้า" (BACKLOG4 E4) — แถบกรอง · แถบสรุปของชุดที่กรอง · เลือกหลายรายการ · การ์ดรีวิว · แบ่งหน้า ·
// modal แท็กภายใน · drawer รายละเอียด (ผลวิเคราะห์ความรู้สึก) · ลิงก์ไปหน้าตั้งค่าหัวข้อ/คำวิเคราะห์
import Link from "next/link";
import { Checkbox, Modal } from "antd";
import { useTranslations } from "next-intl";
import { ArrowDownTrayIcon, CheckIcon, Cog6ToothIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Button, EmptyState, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { PaginationBar } from "@/components/shared/data";
import { DetailDrawer, LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { modalButtonIcons } from "@/components/shared/actions";
import type { useReviewsViewModel } from "./useReviewsViewModel";
import { ReviewFiltersBar } from "./_components/ReviewFiltersBar";
import { ReviewCard } from "./_components/ReviewCard";
import { ReviewDetailContent } from "./_components/ReviewDetailContent";

type VM = ReturnType<typeof useReviewsViewModel>;

export function ReviewsView(vm: VM) {
  const t = useTranslations();
  const s = vm.summary;
  const allSelected = vm.rows.length > 0 && vm.rows.every((r) => vm.selected.has(r._id));

  return (
    <ListPageLayout
      title={t("reviews.title")}
      description={t("reviews.description")}
      actions={
        <Link href="/owner/reports/reviews/settings">
          <Button icon={<Cog6ToothIcon className="h-4 w-4" />}>{t("reviews.settingsLink")}</Button>
        </Link>
      }
    >
      <div className="flex flex-col gap-3">
        <ReviewFiltersBar
          filters={vm.filters}
          setFilter={vm.setFilter}
          search={vm.search}
          setSearch={vm.setSearch}
          onReset={vm.resetFilters}
          categoryOptions={vm.categoryOptions}
          productOptions={vm.productOptions}
          aspectOptions={vm.aspectOptions}
        />

        {/* สรุปของชุดที่กรอง (ทุกหน้า ไม่ใช่แค่หน้านี้) */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-brown-100 bg-brown-50 px-4 py-2.5 text-sm text-brown-800">
          <span>{t("reviews.summary.count", { n: (s?.count ?? 0).toLocaleString() })}</span>
          <span>{t("reviews.summary.avg", { v: s?.avg_rating != null ? s.avg_rating.toFixed(2) : "—" })}</span>
          <span className={(s?.negative_rate ?? 0) >= 0.25 ? "text-rose-600" : ""}>
            {t("reviews.summary.negative", { v: s?.negative_rate != null ? `${Math.round(s.negative_rate * 100)}%` : "—" })}
          </span>
          {(s?.unreplied_negative ?? 0) > 0 && (
            <button type="button" onClick={vm.showUnrepliedNegative} className="font-semibold text-rose-600 hover:underline">
              {t("reviews.summary.unrepliedNegative", { n: s!.unreplied_negative })}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 px-1">
          <Checkbox
            checked={allSelected}
            indeterminate={vm.selected.size > 0 && !allSelected}
            disabled={vm.rows.length === 0}
            onChange={(e) => vm.selectAllOnPage(e.target.checked)}
          >
            <span className="text-xs text-gray-500">{t("reviews.selectPage")}</span>
          </Checkbox>
          {vm.selected.size > 0 && (
            <>
              <span className="text-xs font-semibold text-brown-800">{t("reviews.selectedCount", { n: vm.selected.size })}</span>
              {vm.perm.update && (
                <>
                  <Button size="small" icon={<CheckIcon className="h-4 w-4" />} loading={vm.bulkBusy} onClick={() => vm.onBulkRead(true)}>
                    {t("reviews.markRead")}
                  </Button>
                  <Button size="small" icon={<EyeSlashIcon className="h-4 w-4" />} disabled={vm.bulkBusy} onClick={() => vm.onBulkRead(false)}>
                    {t("reviews.markUnread")}
                  </Button>
                </>
              )}
              <Button size="small" icon={<ArrowDownTrayIcon className="h-4 w-4" />} onClick={vm.onExport}>
                {t("reviews.exportCsv")}
              </Button>
            </>
          )}
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
                selected={vm.selected.has(r._id)}
                canUpdate={vm.perm.update}
                canDelete={vm.perm.delete}
                suggestions={vm.replySuggestions}
                onSelect={() => vm.toggleSelect(r._id)}
                onStatus={(st) => vm.onStatus(r, st)}
                onTogglePin={() => vm.onTogglePin(r)}
                onToggleRead={() => vm.onToggleRead(r)}
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
        <Select
          mode="tags"
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
    </ListPageLayout>
  );
}
