"use client";
// ภาพรวมสิทธิ์ทุกตำแหน่งในตารางเดียว — แถว = เมนู (จัดหมวดเดียวกับ Sidebar) · คอลัมน์ = ตำแหน่ง
// ช่อง = สิทธิ์ที่บันทึกไว้แล้ว (ดู/เพิ่ม/แก้/ลบ/อนุมัติ) · ตำแหน่งประเภท owner = ทุกสิทธิ์โดยไม่ต้องกำหนด
// กดหัวคอลัมน์ = เลือกตำแหน่งนั้นไปแก้ในแท็บ "แก้ไขสิทธิ์รายตำแหน่ง"
import { useTranslations } from "next-intl";
import type { Role } from "@/types/role";
import { PERMISSION_GROUPS, PERM_FIELDS, type RolePerms } from "../permissionGroups";

export function PermissionOverview({
  roles,
  permsByRole,
  memberCounts,
  activeRoleId,
  onSelectRole,
}: {
  roles: Role[];
  permsByRole: Record<string, RolePerms>;
  memberCounts: Record<string, number>;
  activeRoleId: string | null;
  onSelectRole: (id: string) => void;
}) {
  const t = useTranslations();
  const sectionLabel = (key: (typeof PERMISSION_GROUPS)[number]["sectionKey"]) =>
    key === "sectionOther" ? t("permissions.sectionOther") : t(`nav.${key}`);
  const colClass = (roleId: string) => (roleId === activeRoleId ? "bg-brown-50" : "");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="m-0 text-sm text-gray-600">{t("permissions.overviewHint")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th scope="col" className="sticky left-0 z-10 bg-white px-4 py-2.5 text-left text-xs font-semibold text-gray-600">
                {t("permissions.overviewMenu")}
              </th>
              {roles.map((role) => (
                <th key={role._id} scope="col" className={`px-3 py-2 text-left align-bottom ${colClass(role._id)}`}>
                  <button
                    type="button"
                    onClick={() => onSelectRole(role._id)}
                    className="flex flex-col items-start gap-0.5 rounded-md text-left hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brown-600"
                  >
                    <span className="font-semibold text-brown-800">{role.role_name}</span>
                    <span className="text-xs font-normal text-gray-600">
                      {t("permissions.members", { n: memberCounts[role._id] ?? 0 })}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => [
              <tr key={group.sectionKey} className="bg-gray-50">
                <th
                  scope="colgroup"
                  colSpan={roles.length + 1}
                  className="px-4 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                >
                  {sectionLabel(group.sectionKey)}
                </th>
              </tr>,
              ...group.keys.map((menuKey) => (
                <tr key={menuKey} className="border-b border-gray-50">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-2 text-left font-medium text-gray-700">
                    {t(`enums.menuKey.${menuKey}`)}
                  </th>
                  {roles.map((role) => {
                    if (role.role_type === "owner") {
                      return (
                        <td key={role._id} className={`px-3 py-2 ${colClass(role._id)}`}>
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                            {t("permissions.overviewAll")}
                          </span>
                        </td>
                      );
                    }
                    const row = permsByRole[role._id]?.[menuKey];
                    const granted = row ? PERM_FIELDS.filter((f) => row[f]) : [];
                    return (
                      <td key={role._id} className={`px-3 py-2 ${colClass(role._id)}`}>
                        {granted.length === 0 ? (
                          <span className="text-gray-400" aria-label={t("permissions.overviewNone")}>—</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {granted.map((f) => (
                              <span
                                key={f}
                                className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                                  f === "can_view" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {t(`permissions.short.${f}`)}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}
