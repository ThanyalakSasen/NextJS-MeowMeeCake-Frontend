"use client";
// Matrix สิทธิ์ของ role ที่เลือก — จัดกลุ่มตามหมวดหมู่เดียวกับ Sidebar
import { useTranslations } from "next-intl";
import { Collapse, Checkbox } from "antd";
import { Button, Divider } from "@/components/base";
import type { MenuKey } from "@/constants/menuKeys";
import {
  PERMISSION_GROUPS, PERM_FIELDS, countRow,
  type RolePerms, type PermField,
} from "../permissionGroups";

export function PermissionMatrix({
  rows,
  canEdit,
  onField,
  onToggleSection,
}: {
  rows: RolePerms;
  canEdit: boolean;
  onField: (menuKey: MenuKey, field: PermField, value: boolean) => void;
  onToggleSection: (menuKey: MenuKey) => void;
}) {
  const t = useTranslations();

  const sectionLabel = (key: (typeof PERMISSION_GROUPS)[number]["sectionKey"]) =>
    key === "sectionOther" ? t("permissions.sectionOther") : t(`nav.${key}`);

  return (
    <div>
      {PERMISSION_GROUPS.map((group, gi) => (
        <div key={group.sectionKey}>
          {gi > 0 && <Divider className="!my-0" />}
          <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {sectionLabel(group.sectionKey)}
          </p>
          <Collapse
            ghost
            defaultActiveKey={group.keys}
            expandIconPosition="end"
            items={group.keys.map((menuKey) => {
              const row = rows[menuKey];
              const on = countRow(row);
              return {
                key: menuKey,
                label: (
                  <div className="flex items-center justify-between gap-2 pr-2">
                    <span className="text-sm font-medium text-gray-700">{t(`enums.menuKey.${menuKey}`)}</span>
                    <span
                      className="flex shrink-0 items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-gray-400">{on}/5</span>
                      {canEdit && (
                        <Button size="small" type="text" onClick={() => onToggleSection(menuKey)}>
                          {on < 5 ? t("permissions.toggleAllOn") : t("permissions.toggleAllOff")}
                        </Button>
                      )}
                    </span>
                  </div>
                ),
                children: (
                  <div className="flex flex-wrap items-center gap-4 px-4 py-2">
                    {PERM_FIELDS.map((field) => (
                      <Checkbox
                        key={field}
                        checked={row[field]}
                        disabled={!canEdit}
                        onChange={(e) => onField(menuKey, field, e.target.checked)}
                      >
                        <span className="text-sm text-gray-600">{t(`fields.${field}`)}</span>
                      </Checkbox>
                    ))}
                  </div>
                ),
              };
            })}
          />
        </div>
      ))}
    </div>
  );
}
