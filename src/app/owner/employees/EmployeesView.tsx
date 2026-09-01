"use client";
// View ของ Employees List — JSX ล้วน (component กลางล้วน ไม่มี _components เฉพาะหน้า)
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Avatar, Button, Select, Tag } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import type { EmployeeRow, useEmployeesViewModel } from "./useEmployeesViewModel";

type VM = ReturnType<typeof useEmployeesViewModel>;

export function EmployeesView(vm: VM) {
  const t = useTranslations();

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
    { key: "role", title: t("employees.colRole"), render: (r) => <Tag color="blue">{r.roleName}</Tag> },
    {
      key: "type",
      title: t("employees.colType"),
      render: (r) => (r.employmentType ? t(`enums.employmentType.${r.employmentType}`) : "—"),
    },
    { key: "phone", title: t("employees.colPhone"), render: (r) => r.phone },
    {
      key: "status",
      title: t("employees.colStatus"),
      render: (r) => (
        <Tag color={r.working ? "success" : "default"}>
          {r.working ? t("employees.statusWorking") : t("employees.statusLeft")}
        </Tag>
      ),
    },
  ];

  return (
    <ListPageLayout
      title={t("employees.title")}
      description={t("employees.description")}
      actions={
        vm.perm.create && (
          <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} href="/owner/employees/addEmployee">
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
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
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
                      {vm.perm.update && (
                        <Button size="small" href={`/owner/employees/editEmployee?id=${r._id}`}>
                          {t("common.edit")}
                        </Button>
                      )}
                      {vm.perm.delete && (
                        <ConfirmDeletePopup
                          title={t("employees.deleteConfirm", { name: r.name })}
                          onConfirm={() => vm.onDelete(r._id)}
                        >
                          <Button size="small" danger>
                            {t("common.delete")}
                          </Button>
                        </ConfirmDeletePopup>
                      )}
                    </div>
                  )
                : undefined
            }
          />
        </div>
      )}
    </ListPageLayout>
  );
}
