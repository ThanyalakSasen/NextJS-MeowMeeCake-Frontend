"use client";
// แท็บ "หัวข้อรีวิว" — ตัวอย่างปุ่มในฟอร์มลูกค้า · เพิ่ม · รายการ (ลำดับ/ไอคอน/ชื่อ/คำแนะนำ/เปิด-ปิด/ลบ) · หัวข้อที่ลบแล้ว (กู้คืน)
import { Popover, Tooltip } from "antd";
import { useTranslations } from "next-intl";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { Button, Card, Input, Switch } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { DeleteButton, actionIcon } from "@/components/shared/actions";
import AspectIcon, { ASPECT_ICON_KEYS, resolveAspectIcon } from "@/components/customer/AspectIcon";
import { MAX_ASPECTS, type useReviewSettingsViewModel } from "../useReviewSettingsViewModel";

type VM = ReturnType<typeof useReviewSettingsViewModel>;

export function AspectsTab({ vm }: { vm: VM }) {
  const t = useTranslations();
  const canEdit = vm.perm.update;
  const active = vm.aspects.filter((a) => a.is_active);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-sm font-semibold text-brown-800">
            {t("reviewSettings.aspects.activeCount", { active: vm.activeCount, total: vm.aspects.length, max: MAX_ASPECTS })}
          </p>
          <p className="m-0 text-xs text-gray-500">{t("reviewSettings.aspects.howItWorks")}</p>
        </div>
        <p className="m-0 text-xs text-gray-500">{t("reviewSettings.aspects.preview")}</p>
        {active.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {active.map((a) => (
              <Tooltip key={a._id} title={a.placeholder_text || undefined}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brown-200 bg-brown-50 px-3 py-1 text-xs text-brown-800">
                  <AspectIcon icon={resolveAspectIcon(a.icon, a.aspect_name_eng)} size={13} />
                  {a.aspect_name_th}
                </span>
              </Tooltip>
            ))}
          </div>
        ) : (
          <p className="m-0 rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">{t("reviewSettings.aspects.noneActive")}</p>
        )}

        {vm.perm.create && (
          <div className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={vm.newTh} maxLength={50} placeholder={t("reviewSettings.aspects.nameTh")} onChange={(e) => vm.setNewTh(e.target.value)} onPressEnter={vm.onAddAspect} />
            <Input value={vm.newEng} maxLength={50} placeholder={t("reviewSettings.aspects.nameEng")} onChange={(e) => vm.setNewEng(e.target.value)} onPressEnter={vm.onAddAspect} />
            <Button type="primary" icon={actionIcon("add")} loading={vm.adding} disabled={!vm.newTh.trim() || !vm.canAddAspect} onClick={vm.onAddAspect}>
              {t("reviewSettings.aspects.add")}
            </Button>
            {!vm.canAddAspect && <p className="m-0 text-xs text-amber-600 sm:col-span-3">{t("reviewSettings.aspects.limit", { max: MAX_ASPECTS })}</p>}
          </div>
        )}
      </Card>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {vm.aspects.map((a, i) => {
          const renaming = vm.renaming?.id === a._id ? vm.renaming : null;
          const iconKey = resolveAspectIcon(a.icon, a.aspect_name_eng);
          return (
            <li key={a._id} className={`flex flex-col gap-2 rounded-xl border bg-white p-3 ${a.is_active ? "border-gray-100" : "border-dashed border-gray-200 opacity-75"}`}>
              <div className="flex flex-wrap items-center gap-2">
                {canEdit && (
                  <span className="flex flex-col">
                    <Button size="small" type="text" disabled={i === 0 || vm.reordering} aria-label={t("reviewSettings.aspects.moveUp")}
                      icon={<ArrowUpIcon className="h-3.5 w-3.5" />} onClick={() => vm.onMove(i, -1)} />
                    <Button size="small" type="text" disabled={i === vm.aspects.length - 1 || vm.reordering} aria-label={t("reviewSettings.aspects.moveDown")}
                      icon={<ArrowDownIcon className="h-3.5 w-3.5" />} onClick={() => vm.onMove(i, 1)} />
                  </span>
                )}
                <Popover
                  trigger={canEdit ? "click" : []}
                  title={t("reviewSettings.aspects.pickIcon")}
                  content={
                    <div className="grid grid-cols-7 gap-1">
                      {ASPECT_ICON_KEYS.map((k) => (
                        <button key={k} type="button" aria-label={k} onClick={() => vm.onIcon(a, k)}
                          className={`flex h-8 w-8 items-center justify-center rounded border ${k === iconKey ? "border-brown-700 bg-brown-50" : "border-gray-200 hover:border-gray-400"}`}>
                          <AspectIcon icon={k} size={16} />
                        </button>
                      ))}
                    </div>
                  }
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brown-800 ${canEdit ? "cursor-pointer hover:border-gray-400" : ""}`}
                    title={canEdit ? t("reviewSettings.aspects.changeIcon") : undefined}>
                    <AspectIcon icon={iconKey} size={18} />
                  </span>
                </Popover>

                {renaming ? (
                  <span className="flex flex-1 flex-wrap items-center gap-2">
                    <Input size="small" style={{ maxWidth: 200 }} value={renaming.th} maxLength={50} placeholder={t("reviewSettings.aspects.nameTh")}
                      onChange={(e) => vm.setRenaming({ ...renaming, th: e.target.value })} onPressEnter={vm.saveRename} />
                    <Input size="small" style={{ maxWidth: 200 }} value={renaming.eng} maxLength={50} placeholder={t("reviewSettings.aspects.nameEng")}
                      onChange={(e) => vm.setRenaming({ ...renaming, eng: e.target.value })} onPressEnter={vm.saveRename} />
                    <Button size="small" type="primary" onClick={vm.saveRename}>{t("common.save")}</Button>
                    <Button size="small" onClick={() => vm.setRenaming(null)}>{t("common.cancel")}</Button>
                  </span>
                ) : (
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-brown-800">{a.aspect_name_th}</span>
                    {a.aspect_name_eng && a.aspect_name_eng !== a.aspect_name_th && <span className="truncate text-xs text-gray-500">· {a.aspect_name_eng}</span>}
                    {canEdit && (
                      <Button size="small" type="text" aria-label={t("reviewSettings.aspects.rename")} icon={actionIcon("edit", "small")}
                        onClick={() => vm.startRename(a)} />
                    )}
                  </span>
                )}

                <span className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{a.is_active ? t("reviewSettings.aspects.shown") : t("reviewSettings.aspects.hidden")}</span>
                  <Switch size="small" checked={a.is_active} disabled={!canEdit} onChange={() => vm.onToggleActive(a)} />
                  {vm.perm.delete && (
                    <ConfirmDeletePopup title={t("reviewSettings.aspects.deleteConfirm", { name: a.aspect_name_th })} onConfirm={() => vm.onDeleteAspect(a)}>
                      <DeleteButton size="small" />
                    </ConfirmDeletePopup>
                  )}
                </span>
              </div>
              <Input
                key={`${a._id}-${a.placeholder_text ?? ""}`}
                size="small"
                defaultValue={a.placeholder_text ?? ""}
                maxLength={120}
                disabled={!canEdit}
                placeholder={t("reviewSettings.aspects.placeholderHint")}
                onBlur={(e) => vm.onPlaceholder(a, e.target.value)}
                onPressEnter={(e) => vm.onPlaceholder(a, (e.target as HTMLInputElement).value)}
              />
            </li>
          );
        })}
      </ul>

      {vm.deletedAspects.length > 0 && (
        <Card className="flex flex-col gap-2 p-4">
          <p className="m-0 text-sm font-semibold text-gray-600">{t("reviewSettings.aspects.deletedTitle", { n: vm.deletedAspects.length })}</p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {vm.deletedAspects.map((a) => (
              <li key={a._id} className="flex items-center justify-between gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <AspectIcon icon={resolveAspectIcon(a.icon, a.aspect_name_eng)} size={14} />
                  {a.aspect_name_th}
                </span>
                {vm.perm.update && (
                  <Button size="small" disabled={!vm.canAddAspect} onClick={() => vm.onRestoreAspect(a)}>
                    {t("reviewSettings.aspects.restore")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
