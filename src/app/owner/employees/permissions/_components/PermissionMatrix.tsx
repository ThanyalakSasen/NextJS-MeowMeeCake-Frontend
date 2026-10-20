"use client";
// Matrix สิทธิ์ของ role ที่เลือก — จัดกลุ่มตามหมวดหมู่เดียวกับ Sidebar
import { useTranslations } from "next-intl";
import { Collapse, Checkbox } from "antd";
import { Button, Divider } from "@/components/base";
import type { MenuKey } from "@/constants/menuKeys";
import { actionIcon } from "@/components/shared/actions";
import {
  PERMISSION_GROUPS, PERM_FIELDS, countRow,
  type RolePerms, type PermField,
} from "../permissionGroups";

/**
 * canSet: ติ๊กช่องนี้เป็น "เปิด" ได้ไหม (เพดานสิทธิ์ — P4) · ช่องที่เปิดอยู่แล้วกดปิดได้เสมอ
 * sectionTurnsOn: ปุ่มทั้งหมวดจะ "เปิด" (true) หรือ "ปิด" (false)
 */
export function PermissionMatrix({
  rows,
  canEdit,
  canSet,
  sectionTurnsOn,
  onField,
  onToggleSection,
}: {
  rows: RolePerms;
  canEdit: boolean;
  canSet: (menuKey: MenuKey, field: PermField) => boolean;
  sectionTurnsOn: (menuKey: MenuKey) => boolean;
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
          <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {sectionLabel(group.sectionKey)}
          </p>
          {group.menus.map((menu) => (
          <div key={menu.keys[0]}>
          {/* เมนูที่มีหน้าย่อย — หัวข้อชื่อเมนู แล้วหน้าย่อยเยื้องเข้าไป (ตั้งสิทธิ์แยกทีละหน้า) */}
          {menu.groupKey && (
            <p className="m-0 px-4 pb-0.5 pt-2 text-sm font-semibold text-brown-800">{t(`nav.${menu.groupKey}`)}</p>
          )}
          <Collapse
            ghost
            defaultActiveKey={menu.keys}
            expandIconPlacement="end"
            className={menu.groupKey ? "ml-4 border-l border-gray-100" : undefined}
            items={menu.keys.map((menuKey) => {
              const row = rows[menuKey];
              const on = countRow(row);
              const turnOn = sectionTurnsOn(menuKey);
              return {
                key: menuKey,
                label: (
                  <div className="flex items-center justify-between gap-2 pr-2">
                    <span className="text-sm font-medium text-gray-700">{t(`enums.menuKey.${menuKey}`)}</span>
                    <span
                      className="flex shrink-0 items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-gray-500">{on}/5</span>
                      {canEdit && (turnOn || on > 0) && (
                        <Button
                          size="small"
                          type="text"
                          icon={actionIcon(turnOn ? "confirm" : "off", "small")}
                          onClick={() => onToggleSection(menuKey)}
                        >
                          {turnOn ? t("permissions.toggleAllOn") : t("permissions.toggleAllOff")}
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
                        disabled={!canEdit || (!row[field] && !canSet(menuKey, field))}
                        onChange={(e) => onField(menuKey, field, e.target.checked)}
                      >
                        <span className="text-sm text-gray-600">{t(`fields.${field}`)}</span>
                      </Checkbox>
                    ))}
                    {/* การชำระเงิน: อนุมัติ กับ ลบ ทำคนละอย่าง — คืนเงินอยู่ที่ "ลบ" (Final-Backlog P7) */}
                    {menuKey === "payments" && (
                      <p className="m-0 w-full text-xs text-gray-500">{t("permissions.paymentsHint")}</p>
                    )}
                  </div>
                ),
              };
            })}
          />
          </div>
          ))}
        </div>
      ))}
    </div>
  );
}
