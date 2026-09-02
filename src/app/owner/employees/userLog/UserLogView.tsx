"use client";
// View ของ User Activity Log — ตาราง audit log + drawer รายละเอียด
import { useTranslations, useLocale } from "next-intl";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { Button, Select, RangePicker } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { DetailDrawer } from "@/components/shared/feedback";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { formatDate } from "@/i18n/format";
import { USER_LOG_ACTION_CONFIG, type UserLogAction } from "@/constants/enumConfig";
import type { LogRow, useUserLogViewModel } from "./useUserLogViewModel";
import { LogDetailContent } from "./_components/LogDetailContent";

type VM = ReturnType<typeof useUserLogViewModel>;

const ACTION_TYPES: UserLogAction[] = ["CREATE", "READ", "UPDATE", "DELETE", "OTHER"];

export function UserLogView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<LogRow>[] = [
    {
      key: "time",
      title: t("userLog.colTime"),
      render: (r) => formatDate(r.created_at, locale, { withTime: true }),
    },
    {
      key: "employee",
      title: t("userLog.colEmployee"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.userName}</p>
          <p className="text-xs text-gray-400">{r.roleName}</p>
        </div>
      ),
    },
    {
      key: "type",
      title: t("userLog.colType"),
      render: (r) => {
        const cfg = USER_LOG_ACTION_CONFIG[r.action_type];
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {t(`enums.userLogAction.${r.action_type}`)}
          </span>
        );
      },
    },
    {
      key: "detail",
      title: t("userLog.colDetail"),
      render: (r) => (
        <div>
          <p className="text-gray-700">{r.action}</p>
          {r.entity && (
            <p className="mt-0.5 text-xs text-gray-400">
              {t(`entities.${r.entity}`)}
              {r.entity_id && <span className="ml-1 font-mono">{r.entity_id}</span>}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "ip",
      title: t("userLog.colIp"),
      render: (r) => <span className="font-mono text-sm text-gray-400">{r.ip_address ?? "—"}</span>,
    },
  ];

  return (
    <ListPageLayout
      title={t("userLog.title")}
      description={t("userLog.description")}
      actions={
        <Button icon={<ArrowDownTrayIcon className="h-4 w-4" />} onClick={vm.onExport}>
          {t("common.export")}
        </Button>
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("userLog.searchPlaceholder")} />
              <div style={{ minWidth: 170 }}>
                <Select
                  value={vm.employeeId}
                  onChange={(v) => vm.setEmployeeId(v as string)}
                  options={[
                    { value: "all", label: t("userLog.allEmployees") },
                    ...vm.employeeOptions,
                  ]}
                />
              </div>
              <div style={{ minWidth: 150 }}>
                <Select
                  value={vm.actionType}
                  onChange={(v) => vm.setActionType(v as VM["actionType"])}
                  options={[
                    { value: "all", label: t("userLog.allTypes") },
                    ...ACTION_TYPES.map((a) => ({ value: a, label: t(`enums.userLogAction.${a}`) })),
                  ]}
                />
              </div>
              <RangePicker
                value={vm.dateRange}
                onChange={(v) => vm.setDateRange((v as VM["dateRange"]) ?? null)}
              />
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <StatCardsGrid>
            <StatCard label={t("userLog.statTotal")} value={vm.stats.total} sub={t("userLog.statTotalSub")} />
            <StatCard label={t("userLog.statToday")} value={vm.stats.today} sub={t("userLog.statTodaySub")} />
            <StatCard label={t("enums.userLogAction.UPDATE")} value={vm.stats.update} sub={t("userLog.statUpdateSub")} tone="warn" />
            <StatCard label={t("enums.userLogAction.DELETE")} value={vm.stats.remove} sub={t("userLog.statDeleteSub")} tone="muted" />
          </StatCardsGrid>

          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("userLog.empty")}
            onRowClick={vm.onView}
          />
        </div>
      )}

      <DetailDrawer open={vm.drawerOpen} title={t("userLog.detailTitle")} onClose={vm.closeDrawer}>
        {vm.selectedLog && <LogDetailContent log={vm.selectedLog} />}
      </DetailDrawer>
    </ListPageLayout>
  );
}
