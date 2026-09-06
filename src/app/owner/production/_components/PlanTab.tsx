"use client";
// แท็บ 1: แผนการผลิต / ใบสั่งผลิต — presentational ล้วน รับ props จาก useProductionViewModel
import { useTranslations, useLocale } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, Select, Tag } from "@/components/base";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { formatDate } from "@/i18n/format";
import { SOURCE_TYPE_CONFIG } from "@/constants/enumConfig";
import type { ProductionStatus } from "@/constants/enumConfig";
import type { ProductionOrder } from "@/types/productionOrder";
import type { useProductionViewModel } from "../useProductionViewModel";

type VM = ReturnType<typeof useProductionViewModel>;

export function PlanTab(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<ProductionOrder>[] = [
    {
      key: "production_no",
      title: t("production.colNo"),
      render: (o) => (
        <div>
          <p className="font-medium text-brown-900 font-mono">{o.production_no}</p>
          <p className="text-sm text-gray-600">{formatDate(o.production_date, locale)}</p>
        </div>
      ),
    },
    {
      key: "source_type",
      title: t("production.fieldSourceType"),
      render: (o) => {
        const cfg = SOURCE_TYPE_CONFIG[o.source_type];
        return (
          <Tag style={{ background: cfg.bg, color: cfg.color, borderColor: "transparent" }}>
            {t(`enums.sourceType.${o.source_type}`)}
          </Tag>
        );
      },
    },
    {
      key: "items",
      title: t("production.colItems"),
      render: (o) => <span className="text-gray-700">{t("production.itemsCount", { n: o.items.length })}</span>,
    },
    {
      key: "assignee",
      title: t("production.fieldAssignee"),
      render: (o) => o.assignee_name ?? t("production.unassigned"),
    },
    {
      key: "status",
      title: t("common.status"),
      render: (o) => <StatusBadge group="productionStatus" value={o.production_status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-base text-gray-600">{t("production.planDescription", { n: vm.planTotal })}</p>
        {vm.perm.create && (
          <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={vm.openCreate}>
            {t("production.createOrder")}
          </Button>
        )}
      </div>

      <StatCardsGrid>
        <StatCard label={t("common.all")} value={vm.stats.total} />
        <StatCard label={t("enums.productionStatus.planned")} value={vm.stats.planned} />
        <StatCard label={t("enums.productionStatus.in_progress")} value={vm.stats.in_progress} tone="warn" />
        <StatCard label={t("enums.productionStatus.done")} value={vm.stats.done} tone="up" />
      </StatCardsGrid>

      <FilterToolbar
        left={
          <>
            <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("production.searchPlaceholder")} />
            <div style={{ minWidth: 160 }}>
              <Select
                value={vm.statusFilter}
                onChange={(v) => vm.setStatusFilter(v as ProductionStatus | "all")}
                options={[
                  { value: "all", label: t("common.all") },
                  ...(["planned", "in_progress", "done", "cancelled"] as ProductionStatus[]).map((s) => ({
                    value: s,
                    label: t(`enums.productionStatus.${s}`),
                  })),
                ]}
              />
            </div>
          </>
        }
      />

      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={vm.refetch}>{t("common.retry")}</Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={vm.planRows}
          loading={vm.isLoading}
          emptyText={t("production.empty")}
          onRowClick={vm.onView}
          actions={(o) => (
            <Button size="small" onClick={() => vm.onView(o)}>{t("common.view")}</Button>
          )}
          pagination={{ page: vm.page, pageSize: vm.pageSize, total: vm.planTotal, onChange: vm.setPagination }}
        />
      )}
    </div>
  );
}
