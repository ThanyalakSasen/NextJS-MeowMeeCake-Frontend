"use client";
// View ของ Customer Reviews — list + filter + detail drawer (อ่าน + ควบคุมการแสดงผลเท่านั้น)
import { useTranslations } from "next-intl";
import { Select, Switch } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { ConfirmDeletePopup, DetailDrawer } from "@/components/shared/feedback";
import { DeleteButton, RetryButton } from "@/components/shared/actions";
import type { ReviewRow, useReviewsViewModel } from "./useReviewsViewModel";
import { StarRating } from "./_components/StarRating";
import { ReviewDetailContent } from "./_components/ReviewDetailContent";

type VM = ReturnType<typeof useReviewsViewModel>;

export function ReviewsView(vm: VM) {
  const t = useTranslations();

  const columns: Column<ReviewRow>[] = [
    {
      key: "user",
      title: t("reviews.colUser"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.userName}</p>
          {!r.is_visible && <p className="text-xs text-gray-400">{t("reviews.statusHidden")}</p>}
        </div>
      ),
    },
    { key: "product", title: t("reviews.colProduct"), render: (r) => r.productName },
    { key: "rating", title: t("reviews.colRating"), render: (r) => <StarRating rating={r.rating} /> },
    {
      key: "text",
      title: t("reviews.colText"),
      render: (r) => <span className="line-clamp-2 text-gray-600">{r.review_text || t("reviews.noComment")}</span>,
    },
  ];

  return (
    <ListPageLayout
      title={t("reviews.title")}
      description={t("reviews.description")}
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("reviews.searchPlaceholder")} />
              <div style={{ minWidth: 180 }}>
                <Select
                  value={vm.productId}
                  onChange={(v) => vm.setProductId(v as string)}
                  options={[{ value: "all", label: t("reviews.allProducts") }, ...vm.productOptions]}
                />
              </div>
              <div style={{ minWidth: 130 }}>
                <Select
                  value={vm.ratingFilter}
                  onChange={(v) => vm.setRatingFilter(v as VM["ratingFilter"])}
                  options={[
                    { value: "all", label: t("reviews.allRatings") },
                    ...[5, 4, 3, 2, 1].map((n) => ({ value: n, label: t("reviews.ratingStars", { n }) })),
                  ]}
                />
              </div>
              <div style={{ minWidth: 150 }}>
                <Select
                  value={vm.visibilityFilter}
                  onChange={(v) => vm.setVisibilityFilter(v as VM["visibilityFilter"])}
                  options={[
                    { value: "all", label: t("reviews.allVisibility") },
                    { value: "visible", label: t("reviews.statusVisible") },
                    { value: "hidden", label: t("reviews.statusHidden") },
                  ]}
                />
              </div>
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <RetryButton onClick={() => vm.refetch()} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <StatCardsGrid>
            <StatCard label={t("reviews.statTotal")} value={vm.stats.total} sub={t("reviews.statTotalSub")} />
            <StatCard label={t("reviews.statAvgRating")} value={vm.stats.avgRating.toFixed(1)} sub={t("reviews.statAvgRatingSub")} tone="up" />
            <StatCard label={t("reviews.statLowRating")} value={vm.stats.lowRating} sub={t("reviews.statLowRatingSub")} tone="warn" />
            <StatCard label={t("reviews.statHidden")} value={vm.stats.hidden} sub={t("reviews.statHiddenSub")} tone="muted" />
          </StatCardsGrid>

          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("reviews.empty")}
            onRowClick={vm.onView}
            actions={(r) => (
              <div className="flex items-center justify-end gap-2">
                <Switch
                  size="small"
                  checked={r.is_visible}
                  disabled={!vm.perm.update}
                  onChange={() => vm.onToggleVisibility(r)}
                  aria-label={t("reviews.toggleVisibleAria")}
                />
                {vm.perm.delete && (
                  <ConfirmDeletePopup title={t("reviews.deleteConfirm")} onConfirm={() => vm.onDelete(r._id)}>
                    <DeleteButton size="small" />
                  </ConfirmDeletePopup>
                )}
              </div>
            )}
          />
        </div>
      )}

      <DetailDrawer open={vm.drawerOpen} title={t("reviews.detailTitle")} onClose={vm.closeDrawer}>
        {vm.selectedReview && <ReviewDetailContent review={vm.selectedReview} />}
      </DetailDrawer>
    </ListPageLayout>
  );
}
