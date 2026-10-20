"use client";
// แถบซ้าย — รายการตำแหน่ง (Role) ให้เลือกจัดการสิทธิ์
import { useTranslations } from "next-intl";
import { Tag } from "@/components/base";
import type { Role } from "@/types/role";
import { ROLE_TYPE_CONFIG } from "@/constants/enumConfig";
import { PERM_MENU_KEYS } from "../permissionGroups";

export function RoleListPanel({
  roles,
  memberCounts,
  viewMenuCount,
  activeRoleId,
  onSelect,
}: {
  roles: Role[];
  memberCounts: Record<string, number>;
  /** จำนวนเมนูที่ตำแหน่งนี้ "ดูได้" (สิทธิ์ที่บันทึกแล้ว) */
  viewMenuCount: (roleId: string) => number;
  activeRoleId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations();

  return (
    <div className="self-start overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-600">
        {t("permissions.allRolesTitle")}
      </div>
      {roles.map((role) => {
        const selected = role._id === activeRoleId;
        return (
          <button
            key={role._id}
            type="button"
            onClick={() => onSelect(role._id)}
            className={`flex w-full items-center justify-between gap-2 border-b border-gray-50 px-4 py-2.5 text-left transition-colors last:border-0 ${
              selected ? "bg-brown-50" : "hover:bg-gray-50"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-brown-800">{role.role_name}</p>
              {/* gray-600 — แถวที่เลือกพื้น brown-50 ทำให้ gray-500 ได้แค่ 4.46:1 */}
              <p className="mt-0.5 text-xs text-gray-600">
                {t("permissions.members", { n: memberCounts[role._id] ?? 0 })}
                {" · "}
                {role.role_type === "owner"
                  ? t("permissions.overviewAll")
                  : t("permissions.viewMenus", { n: viewMenuCount(role._id), total: PERM_MENU_KEYS.length })}
              </p>
            </div>
            <Tag color={ROLE_TYPE_CONFIG[role.role_type]?.antColor}>
              {role.role_type}
            </Tag>
          </button>
        );
      })}
    </div>
  );
}
