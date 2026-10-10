"use client";
// View ของ Employees List — JSX ล้วน (+ ResetPasswordModal สำหรับตั้งรหัสผ่านใหม่)
import { useTranslations, useLocale } from "next-intl";
import { KeyIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import { formatDate } from "@/i18n/format";
import { ResetPasswordModal } from "./_components/ResetPasswordModal";
import { Avatar, Button, Select, Tag } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { DeleteButton, EditButton, RetryButton, actionIcon } from "@/components/shared/actions";
import type { EmployeeRow, useEmployeesViewModel } from "./useEmployeesViewModel";
import { EMPLOYEE_WORKING_CONFIG, NOTICE_TAG } from "@/constants/enumConfig";

type VM = ReturnType<typeof useEmployeesViewModel>;

export function EmployeesView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<EmployeeRow>[] = [
    {
      key: "name",
      title: t("employees.colName"),
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar name={r.name} size={28} />
          <span className="font-medium text-brown-800">{r.name}</span>
        </div>
      ),
    },
    { key: "role", title: t("employees.colRole"), render: (r) => <Tag color={NOTICE_TAG.roleName}>{r.roleName}</Tag> },
    {
      key: "type",
      title: t("employees.colType"),
      // ข้อมูลเก่าบางแถวมีค่านอก enum ที่ schema กำหนด (เช่น "Active" — ดู docs/BACKLOG.md §2)
      // กัน MISSING_MESSAGE ด้วย t.has() เหมือนแพทเทิร์นเดียวกันที่ userLog/UserLogView.tsx ใช้
      render: (r) =>
        r.employmentType
          ? t.has(`enums.employmentType.${r.employmentType}`)
            ? t(`enums.employmentType.${r.employmentType}`)
            : t("enums.employmentType.fallback")
          : "—",
    },
    { key: "phone", title: t("employees.colPhone"), render: (r) => r.phone },
    {
      key: "status",
      title: t("employees.colStatus"),
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          <Tag color={EMPLOYEE_WORKING_CONFIG[r.working ? "working" : "left"].antColor} className="!m-0">
            {r.working ? t("employees.statusWorking") : t("employees.statusLeft")}
          </Tag>
          {r.locked && r.lockedUntil && (
            <Tag
              color={NOTICE_TAG.cancelled}
              className="!m-0"
              title={t("employees.lockedUntil", { time: formatDate(r.lockedUntil, locale, { withTime: true }) })}
            >
              {t("employees.statusLocked")}
            </Tag>
          )}
        </div>
      ),
    },
  ];

  return (
    <ListPageLayout
      title={t("employees.title")}
      description={t("employees.description")}
      actions={
        vm.perm.create && (
          <Button type="primary" icon={actionIcon("add")} href="/owner/employees/addEmployee">
            {t("employees.addEmployee")}
          </Button>
        )
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("employees.searchPlaceholder")} />
              <div style={{ minWidth: 160 }}>
                <Select
                  value={vm.roleId}
                  onChange={(v) => vm.setRoleId(v as string)}
                  options={[
                    { value: "all", label: t("employees.allRoles") },
                    ...vm.staffRoles.map((r) => ({ value: r._id, label: r.role_name })),
                  ]}
                />
              </div>
              <div style={{ minWidth: 140 }}>
                <Select
                  value={vm.status}
                  onChange={(v) => vm.setStatus(v as VM["status"])}
                  options={[
                    { value: "all", label: t("common.all") },
                    { value: "working", label: t("employees.statusWorking") },
                    { value: "left", label: t("employees.statusLeft") },
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
            <StatCard label={t("employees.statTotal")} value={vm.stats.total} sub={t("employees.statTotalSub")} />
            <StatCard label={t("employees.statWorking")} value={vm.stats.working} sub={t("employees.statWorkingSub")} tone="up" />
            <StatCard label={t("employees.statLeft")} value={vm.stats.left} sub={t("employees.statLeftSub")} tone="warn" />
            <StatCard label={t("employees.statRoles")} value={vm.stats.roles} sub={t("employees.statRolesSub")} />
          </StatCardsGrid>

          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("employees.empty")}
            actions={
              vm.perm.update || vm.perm.delete
                ? (r) => (
                    <div className="flex justify-end gap-2">
                      {vm.perm.update && r.locked && (
                        <Button
                          size="small"
                          icon={<LockOpenIcon className="h-3.5 w-3.5" />}
                          loading={vm.unlockingId === r._id}
                          onClick={() => vm.onUnlock(r)}
                        >
                          {t("employees.unlock")}
                        </Button>
                      )}
                      {vm.perm.update && (
                        <Button
                          size="small"
                          icon={<KeyIcon className="h-3.5 w-3.5" />}
                          onClick={() => vm.openPassword(r)}
                        >
                          {t("employees.resetPassword")}
                        </Button>
                      )}
                      {vm.perm.update && (
                        <EditButton size="small" href={`/owner/employees/editEmployee?id=${r._id}`} />
                      )}
                      {vm.perm.delete && (
                        <ConfirmDeletePopup
                          title={t("employees.deleteConfirm", { name: r.name })}
                          onConfirm={() => vm.onDelete(r._id)}
                        >
                          <DeleteButton size="small" />
                        </ConfirmDeletePopup>
                      )}
                    </div>
                  )
                : undefined
            }
          />
        </div>
      )}

      <ResetPasswordModal
        target={vm.passwordTarget}
        saving={vm.savingPassword}
        onClose={vm.closePassword}
        onSave={vm.onSavePassword}
      />
    </ListPageLayout>
  );
}
