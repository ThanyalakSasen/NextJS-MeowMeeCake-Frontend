"use client";
// View ของ Permissions Mgmt — 2 คอลัมน์: รายการ Role | matrix สิทธิ์
import { useState } from "react";
import dynamic from "next/dynamic";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { useTranslations } from "next-intl";
import { Button, Tag, EmptyState } from "@/components/base";
import { DashboardPageLayout } from "@/components/shared/layout";
import { LoadingSpin, ConfirmDeletePopup } from "@/components/shared/feedback";
import { DeleteButton, EditButton, SaveButton, actionIcon } from "@/components/shared/actions";
import type { usePermissionsViewModel } from "./usePermissionsViewModel";
import { RoleListPanel } from "./_components/RoleListPanel";
import { PermissionMatrix } from "./_components/PermissionMatrix";
import { PermissionOverview } from "./_components/PermissionOverview";
import { Segmented } from "antd";
import { ROLE_TYPE_CONFIG } from "@/constants/enumConfig";
import { RestoreDeletedButton } from "@/components/shared/restore";

// โมดัลเพิ่ม/เปลี่ยนชื่อตำแหน่งแยก chunk — โหลดเมื่อเปิดครั้งแรก (โมดัลไม่ render ฝั่ง server อยู่แล้ว)
const RoleFormModal = dynamic(() => import("./_components/RoleFormModal").then((m) => m.RoleFormModal), { ssr: false });
const RenameRoleModal = dynamic(() => import("./_components/RenameRoleModal").then((m) => m.RenameRoleModal), { ssr: false });

type VM = ReturnType<typeof usePermissionsViewModel>;

export function PermissionsView(vm: VM) {
  const t = useTranslations();
  const [modalOpen, setModalOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  // เปิดมาเห็นภาพรวมทุกตำแหน่งก่อน — ตอบได้ทันทีว่าใครเข้าถึงอะไร · กดชื่อตำแหน่งเพื่อไปแก้
  const [view, setView] = useState<"overview" | "edit">("overview");
  const addUsed = useOpenedOnce(modalOpen);
  const renameUsed = useOpenedOnce(renameOpen);
  // ตำแหน่งประเภท owner — คนที่ไม่ใช่ owner แก้ชื่อ / ลบ / แก้สิทธิ์ไม่ได้ (backend ownerProtection · P4)
  const canEdit = vm.perm.update && !vm.roleLocked;
  // ตำแหน่งประเภท owner ไม่มีตารางสิทธิ์ให้แก้ (ผ่านทุกสิทธิ์) — ไม่โชว์ปุ่มรีเซ็ต/บันทึก แต่ยังแก้ชื่อได้
  const canEditPerms = canEdit && vm.selectedRole?.role_type !== "owner";

  const addRoleBtn = vm.perm.create && (
    <Button type="primary" icon={actionIcon("add")} onClick={() => setModalOpen(true)}>
      {t("permissions.addRole")}
    </Button>
  );

  return (
    <DashboardPageLayout title={t("permissions.title")} actions={<RestoreDeletedButton menu="permissions" resources={["roles"]} />}>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              value={view}
              onChange={(v) => setView(v as "overview" | "edit")}
              options={[
                { value: "overview", label: t("permissions.tabOverview") },
                { value: "edit", label: t("permissions.tabEdit") },
              ]}
            />
            {addRoleBtn}
          </div>

          {view === "overview" ? (
            <PermissionOverview
              roles={vm.roles}
              permsByRole={vm.permsByRole}
              memberCounts={vm.memberCounts}
              activeRoleId={vm.activeRoleId}
              onSelectRole={(id) => {
                vm.selectRole(id);
                setView("edit");
              }}
            />
          ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
            <RoleListPanel
              roles={vm.roles}
              memberCounts={vm.memberCounts}
              viewMenuCount={vm.viewMenuCount}
              activeRoleId={vm.activeRoleId}
              onSelect={vm.selectRole}
            />

            {vm.selectedRole && vm.selectedRows ? (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                {/* header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-brown-800">{vm.selectedRole.role_name}</h2>
                      <Tag color={ROLE_TYPE_CONFIG[vm.selectedRole.role_type]?.antColor}>
                        {vm.selectedRole.role_type}
                      </Tag>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {t("permissions.members", { n: vm.memberCounts[vm.selectedRole._id] ?? 0 })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {canEdit && (
                      <EditButton size="small" label={t("permissions.renameRole")} onClick={() => setRenameOpen(true)} />
                    )}
                    {vm.perm.delete && !vm.roleLocked && (
                      <ConfirmDeletePopup
                        title={t("permissions.deleteRoleConfirm", { role: vm.selectedRole.role_name })}
                        onConfirm={vm.onDeleteRole}
                      >
                        <DeleteButton size="small" label={t("permissions.deleteRole")} />
                      </ConfirmDeletePopup>
                    )}
                    {canEditPerms && (
                      <Button size="small" icon={actionIcon("reset", "small")} onClick={vm.onReset} loading={vm.saving}>
                        {t("permissions.reset")}
                      </Button>
                    )}
                    {canEditPerms && (
                      <SaveButton
                        size="small"
                        type="primary"
                        label={t("permissions.save")}
                        onClick={vm.onSave}
                        loading={vm.saving}
                        disabled={!vm.dirty}
                      />
                    )}
                  </div>
                </div>

                {vm.selectedRole.role_type === "owner" ? (
                  // ตำแหน่งประเภท owner ผ่านทุกสิทธิ์ (backend ไม่อ่านแถวสิทธิ์เลย) — ไม่โชว์ตารางช่องว่างให้เข้าใจผิดว่าไม่มีสิทธิ์
                  <div className="flex flex-col gap-1 px-4 py-6">
                    <p className="m-0 font-semibold text-purple-700">{t("permissions.overviewAll")}</p>
                    <p className="m-0 text-sm text-gray-600">
                      {t("permissions.unrestrictedNote")}
                      {vm.roleLocked && ` · ${t("permissions.ownerRoleLocked")}`}
                    </p>
                  </div>
                ) : (
                <>
                {/* summary */}
                <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50 text-center">
                  {[
                    { v: vm.summary.total, l: t("permissions.summaryTotal"), c: "text-brown-900" },
                    { v: vm.summary.on, l: t("permissions.summaryOn"), c: "text-green-700" },
                    { v: vm.summary.total - vm.summary.on, l: t("permissions.summaryOff"), c: "text-gray-500" },
                  ].map((s) => (
                    <div key={s.l} className="border-r border-gray-100 py-3 last:border-0">
                      <p className={`text-lg font-semibold ${s.c}`}>{s.v}</p>
                      <p className="text-xs text-gray-500">{s.l} · {t("permissions.summaryUnit")}</p>
                    </div>
                  ))}
                </div>

                {canEdit && !vm.isOwnerActor && (
                  <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
                    {t("permissions.grantCeilingNote")}
                  </p>
                )}

                <PermissionMatrix
                  rows={vm.selectedRows}
                  canEdit={canEdit}
                  canSet={vm.canSet}
                  sectionTurnsOn={vm.sectionTurnsOn}
                  onField={vm.setField}
                  onToggleSection={vm.toggleSection}
                />
                </>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white p-10">
                <EmptyState description={t("permissions.emptySelectRole")} />
              </div>
            )}
          </div>
          )}
        </>
      )}

      {addUsed && (
        <RoleFormModal
          open={modalOpen}
          roles={vm.roles}
          canCopyFrom={vm.canCopyFrom}
          onCancel={() => setModalOpen(false)}
          onSubmit={async (values) => {
            const ok = await vm.onAddRole(values);
            if (ok) setModalOpen(false);
            return ok;
          }}
        />
      )}

      {renameUsed && (
        <RenameRoleModal
          role={renameOpen ? vm.selectedRole : null}
          roles={vm.roles}
          saving={vm.renaming}
          onCancel={() => setRenameOpen(false)}
          onSubmit={async (name) => {
            const ok = await vm.onRenameRole(name);
            if (ok) setRenameOpen(false);
            return ok;
          }}
        />
      )}
    </DashboardPageLayout>
  );
}
