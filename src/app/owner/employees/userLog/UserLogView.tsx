"use client";
// View ของ User Activity Log — ตาราง audit log + drawer รายละเอียด
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { Button, Select, LazyRangePicker } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { LoadFailed } from "@/components/shared/feedback";
import { DataTable, FilterToolbar, SearchInput, type Column, FilterField } from "@/components/shared/data";
import { formatDate } from "@/i18n/format";
import { USER_LOG_ACTION_CONFIG, type UserLogAction } from "@/constants/enumConfig";
import type { LogRow, useUserLogViewModel } from "./useUserLogViewModel";
import { ChangeSummary } from "./_components/ChangeSummary";

// ลิ้นชักรายละเอียดแยก chunk — โหลดเมื่อเปิดครั้งแรก (ลิ้นชักไม่ render ฝั่ง server อยู่แล้ว)
const DetailDrawer = dynamic(() => import("@/components/shared/feedback/DetailDrawer").then((m) => m.DetailDrawer), { ssr: false });
const LogDetailContent = dynamic(() => import("./_components/LogDetailContent").then((m) => m.LogDetailContent), { ssr: false });

type VM = ReturnType<typeof useUserLogViewModel>;

const ACTION_TYPES: UserLogAction[] = ["CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "OTHER"];

export function UserLogView(vm: VM) {
  const t = useTranslations();
  const drawerUsed = useOpenedOnce(vm.drawerOpen);
  const locale = useLocale();

  const columns: Column<LogRow>[] = [
    {
      key: "time",
      title: t("systemLog.colTime"),
      render: (r) => formatDate(r.created_at, locale, { withTime: true }),
    },
    {
      key: "employee",
      title: t("systemLog.colEmployee"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.userName}</p>
          <p className="text-xs text-gray-500">{r.roleName}</p>
        </div>
      ),
    },
    {
      key: "type",
      title: t("systemLog.colType"),
      render: (r) => {
        const cfg = USER_LOG_ACTION_CONFIG[r.action_type];
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {t(`enums.systemLogAction.${r.action_type}`)}
          </span>
        );
      },
    },
    {
      key: "detail",
      title: t("systemLog.colDetail"),
      render: (r) => (
        <div>
          <p className="text-gray-700">{r.action}</p>
          <ChangeSummary log={r} />
        </div>
      ),
    },
    {
      key: "ip",
      title: t("systemLog.colIp"),
      render: (r) => <span className="font-mono text-sm text-gray-500">{r.ip_address ?? "—"}</span>,
    },
  ];

  return (
    <ListPageLayout
      title={t("systemLog.title")}
      actions={
        <Button icon={<ArrowDownTrayIcon className="h-4 w-4" />} onClick={vm.onExport} loading={vm.exporting}>
          {t("common.export")}
        </Button>
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("systemLog.searchPlaceholder")} />
              <FilterField label={t("filterLabel.employee")} minWidth={170}>
                <Select
                  value={vm.employeeId}
                  onChange={(v) => vm.setEmployeeId(v as string)}
                  options={[
                    { value: "all", label: t("systemLog.allUsers") },
                    ...vm.employeeOptions,
                  ]}
                />
              </FilterField>
              <FilterField label={t("filterLabel.actionType")} minWidth={150}>
                <Select
                  value={vm.actionType}
                  onChange={(v) => vm.setActionType(v as VM["actionType"])}
                  options={[
                    { value: "all", label: t("systemLog.allTypes") },
                    ...ACTION_TYPES.map((a) => ({ value: a, label: t(`enums.systemLogAction.${a}`) })),
                  ]}
                />
              </FilterField>
              {/* โหลดปฏิทินเมื่อกด — RangePicker ของ antd หนักตอน hydrate (ดู base/LazyDatePicker) */}
              <LazyRangePicker
                value={vm.dateRange}
                onChange={(v) => vm.setDateRange((v as VM["dateRange"]) ?? null)}
              />
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : (
        <div className="flex flex-col gap-5">
          <StatCardsGrid>
            <StatCard label={t("systemLog.statTotal")} value={vm.stats.total} sub={t("systemLog.statTotalSub")} />
            <StatCard label={t("systemLog.statToday")} value={vm.stats.today} sub={t("systemLog.statTodaySub")} />
            <StatCard label={t("enums.systemLogAction.UPDATE")} value={vm.stats.update} sub={t("systemLog.statUpdateSub")} tone="warn" />
            <StatCard label={t("enums.systemLogAction.DELETE")} value={vm.stats.remove} sub={t("systemLog.statDeleteSub")} tone="muted" />
          </StatCardsGrid>

          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("systemLog.empty")}
            onRowClick={vm.onView}
            pagination={vm.pagination}
          />
        </div>
      )}

      {drawerUsed && (
        <DetailDrawer open={vm.drawerOpen} title={t("systemLog.detailTitle")} onClose={vm.closeDrawer}>
          {vm.selectedLog && <LogDetailContent log={vm.selectedLog} />}
        </DetailDrawer>
      )}
    </ListPageLayout>
  );
}
