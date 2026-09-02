"use client";
// View ของ Permissions Mgmt — 2 คอลัมน์: รายการ Role | matrix สิทธิ์
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, Tag, EmptyState } from "@/components/base";
import { DashboardPageLayout } from "@/components/shared/layout";
import { LoadingSpin, ConfirmDeletePopup } from "@/components/shared/feedback";
import type { usePermissionsViewModel } from "./usePermissionsViewModel";
import { RoleListPanel } from "./_components/RoleListPanel";
import { PermissionMatrix } from "./_components/PermissionMatrix";
import { RoleFormModal } from "./_components/RoleFormModal";

type VM = ReturnType<typeof usePermissionsViewModel>;

export function PermissionsView(vm: VM) {
  const t = useTranslations();
  const [modalOpen, setModalOpen] = useState(false);
  const canEdit = vm.perm.update;

  const addRoleBtn = vm.perm.create && (
    <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
      {t("permissions.addRole")}
    </Button>
  );

  return (
    <DashboardPageLayout title={t("permissions.title")} description={t("permissions.description")}>
      {vm.isError ? (
        <div className="py-10 text-center text-gray-600">{t("permissions.loadFailed")}</div>
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : vm.roles.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <EmptyState description={t("permissions.emptyNoRoles")} />
          {addRoleBtn}
        </div>
      ) : (
        <>
          <div className="flex justify-end">{addRoleBtn}</div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
            <RoleListPanel
              roles={vm.roles}
              memberCounts={vm.memberCounts}
              activeRoleId={vm.activeRoleId}
              onSelect={vm.selectRole}
            />

            {vm.selectedRole && vm.selectedRows ? (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {/* header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-brown-800">{vm.selectedRole.role_name}</h2>
                      <Tag color={vm.selectedRole.role_type === "owner" || vm.selectedRole.role_type === "admin" ? "gold" : "blue"}>
                        {vm.selectedRole.role_type}
                      </Tag>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {t("permissions.members", { n: vm.memberCounts[vm.selectedRole._id] ?? 0 })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {vm.perm.delete && (
                      <ConfirmDeletePopup
                        title={t("permissions.deleteRoleConfirm", { role: vm.selectedRole.role_name })}
                        onConfirm={vm.onDeleteRole}
                      >
                        <Button size="small" danger>{t("permissions.deleteRole")}</Button>
                      </ConfirmDeletePopup>
                    )}
                    {canEdit && (
                      <Button size="small" onClick={vm.onReset} loading={vm.saving}>
                        {t("permissions.reset")}
                      </Button>
                    )}
                    {canEdit && (
                      <Button size="small" type="primary" onClick={vm.onSave} loading={vm.saving} disabled={!vm.dirty}>
                        {t("permissions.save")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* summary */}
                <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50 text-center">
                  {[
                    { v: vm.summary.total, l: t("permissions.summaryTotal"), c: "text-brown-900" },
                    { v: vm.summary.on, l: t("permissions.summaryOn"), c: "text-green-600" },
                    { v: vm.summary.total - vm.summary.on, l: t("permissions.summaryOff"), c: "text-gray-400" },
                  ].map((s) => (
                    <div key={s.l} className="border-r border-gray-100 py-3 last:border-0">
                      <p className={`text-lg font-semibold ${s.c}`}>{s.v}</p>
                      <p className="text-xs text-gray-400">{s.l} · {t("permissions.summaryUnit")}</p>
                    </div>
                  ))}
                </div>

                {(vm.selectedRole.role_type === "owner" || vm.selectedRole.role_type === "admin") && (
                  <p className="border-b border-gray-100 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                    {t("permissions.unrestrictedNote")}
                  </p>
                )}

                <PermissionMatrix
                  rows={vm.selectedRows}
                  canEdit={canEdit}
                  onField={vm.setField}
                  onToggleSection={vm.toggleSection}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 p-10">
                <EmptyState description={t("permissions.emptySelectRole")} />
              </div>
            )}
          </div>
        </>
      )}

      <RoleFormModal
        open={modalOpen}
        roles={vm.roles}
        onCancel={() => setModalOpen(false)}
        onSubmit={async (values) => {
          const ok = await vm.onAddRole(values);
          if (ok) setModalOpen(false);
          return ok;
        }}
      />
    </DashboardPageLayout>
  );
}
