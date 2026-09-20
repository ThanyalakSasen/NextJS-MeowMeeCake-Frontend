"use client";
// แท็บ 1: รอบพรีออเดอร์ — presentational ล้วน รับ props จาก usePreOrderRoundViewModel
import { useTranslations, useLocale } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, Select } from "@/components/base";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatDate } from "@/i18n/format";
import type { RoundStatus } from "@/constants/enumConfig";
import type { PreorderRound } from "@/types/preorderRound";
import type { usePreOrderRoundViewModel } from "../usePreOrderRoundViewModel";
import { isFinalRoundStatus } from "../preorderStatus";

type VM = ReturnType<typeof usePreOrderRoundViewModel>;

export function RoundsTab(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<PreorderRound>[] = [
    {
      key: "round_name",
      title: t("preorderRound.colRoundName"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.round_name}</p>
          <p className="text-sm text-gray-600">{t("preorderRound.itemCount", { n: r.item_count ?? 0 })}</p>
        </div>
      ),
    },
    {
      key: "open_close",
      title: t("preorderRound.colOpenClose"),
      render: (r) => (
        <span className="text-gray-700">
          {formatDate(r.open_date, locale)} - {formatDate(r.close_date, locale)}
        </span>
      ),
    },
    {
      key: "pickup_date",
      title: t("preorderRound.colPickupDate"),
      render: (r) => formatDate(r.pickup_date, locale),
    },
    {
      key: "round_status",
      title: t("common.status"),
      render: (r) => <StatusBadge group="roundStatus" value={r.round_status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-base text-gray-600">{t("preorderRound.roundsDescription", { n: vm.roundTotal })}</p>
        {vm.perm.create && (
          <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={vm.openCreateRound}>
            {t("preorderRound.createRound")}
          </Button>
        )}
      </div>

      <StatCardsGrid>
        <StatCard label={t("common.all")} value={vm.roundStats.total} />
        <StatCard label={t("enums.roundStatus.scheduled")} value={vm.roundStats.scheduled} />
        <StatCard label={t("enums.roundStatus.open")} value={vm.roundStats.open} tone="up" />
        <StatCard label={t("preorderRound.statClosedOrCancelled")} value={vm.roundStats.closed} tone="muted" />
      </StatCardsGrid>

      <FilterToolbar
        left={
          <>
            <SearchInput value={vm.roundSearch} onChange={vm.setRoundSearch} placeholder={t("preorderRound.searchRoundPlaceholder")} />
            <div style={{ minWidth: 160 }}>
              <Select
                value={vm.roundStatusFilter}
                onChange={(v) => vm.setRoundStatusFilter(v as RoundStatus | "all")}
                options={[
                  { value: "all", label: t("common.all") },
                  ...(["scheduled", "open", "closed", "cancelled"] as RoundStatus[]).map((s) => ({
                    value: s,
                    label: t(`enums.roundStatus.${s}`),
                  })),
                ]}
              />
            </div>
          </>
        }
      />

      {vm.isRoundsError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={vm.refetchRounds}>{t("common.retry")}</Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={vm.roundRows}
          loading={vm.isRoundsLoading}
          emptyText={t("preorderRound.roundsEmpty")}
          onRowClick={vm.onViewRound}
          actions={(r) => (
            <div className="flex justify-end gap-2">
              <Button size="small" onClick={() => vm.onViewRound(r)}>{t("common.view")}</Button>
              {vm.perm.delete && isFinalRoundStatus(r.round_status) && (
                <ConfirmDeletePopup title={t("preorderRound.deleteConfirm")} onConfirm={() => vm.onDeleteRound(r._id)}>
                  <Button size="small" danger>{t("common.delete")}</Button>
                </ConfirmDeletePopup>
              )}
            </div>
          )}
          pagination={{ page: vm.roundPage, pageSize: vm.roundPageSize, total: vm.roundTotal, onChange: vm.setRoundPagination }}
        />
      )}
    </div>
  );
}
