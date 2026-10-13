"use client";
// แท็บ "ประวัติการทำงาน" — log ของตัวเองเท่านั้น (ตารางแบบหน้าบันทึกการทำงานของพนักงาน ไม่มีคอลัมน์พนักงาน)
import { useLocale, useTranslations } from "next-intl";
import { RangePicker, Select } from "@/components/base";
import { DataTable, FilterToolbar, SearchInput, type Column, FilterField } from "@/components/shared/data";
import { DetailDrawer, LoadFailed } from "@/components/shared/feedback";
import { formatDate } from "@/i18n/format";
import { USER_LOG_ACTION_CONFIG, type UserLogAction } from "@/constants/enumConfig";
import type { LogRow } from "../../employees/userLog/useUserLogViewModel";
import { LogDetailContent } from "../../employees/userLog/_components/LogDetailContent";
import { ChangeSummary } from "../../employees/userLog/_components/ChangeSummary";
import type { useAccountViewModel } from "../useAccountViewModel";

type VM = ReturnType<typeof useAccountViewModel>;

const ACTION_TYPES: UserLogAction[] = ["CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "OTHER"];

export function LogsTab(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<LogRow>[] = [
    {
      key: "time",
      title: t("userLog.colTime"),
      render: (r) => formatDate(r.created_at, locale, { withTime: true }),
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
          <ChangeSummary log={r} />
        </div>
      ),
    },
    {
      key: "ip",
      title: t("userLog.colIp"),
      render: (r) => <span className="font-mono text-sm text-gray-500">{r.ip_address ?? "—"}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-gray-500">{t("myAccount.logsDescription")}</p>
      <FilterToolbar
        left={
          <>
            <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("myAccount.logsSearch")} />
            <FilterField label={t("filterLabel.actionType")} minWidth={150}>
              <Select
                value={vm.actionType}
                onChange={(v) => vm.setActionType(v as VM["actionType"])}
                options={[
                  { value: "all", label: t("userLog.allTypes") },
                  ...ACTION_TYPES.map((a) => ({ value: a, label: t(`enums.userLogAction.${a}`) })),
                ]}
              />
            </FilterField>
            <RangePicker value={vm.dateRange} onChange={(v) => vm.setDateRange((v as VM["dateRange"]) ?? null)} />
          </>
        }
      />

      {vm.logsFailed ? (
        <LoadFailed onRetry={vm.refetchLogs} />
      ) : (
        <DataTable
          columns={columns}
          rows={vm.logs}
          loading={vm.logsLoading}
          emptyText={t("userLog.empty")}
          onRowClick={vm.onViewLog}
        />
      )}

      <DetailDrawer open={vm.drawerOpen} title={t("userLog.detailTitle")} onClose={vm.closeDrawer}>
        {vm.selectedLog && <LogDetailContent log={vm.selectedLog} />}
      </DetailDrawer>
    </div>
  );
}
