"use client";
// แท็บ "หัวข้อรีวิว" — ตัวอย่างปุ่มในฟอร์มลูกค้า · เพิ่ม · รายการ (ลากจัดลำดับ/ไอคอน/ชื่อ/เปิด-ปิด/ลบ)
// ลากการ์ด = HTML5 drag-and-drop เนทีฟ (แพทเทิร์นเดียวกับหน้าแบนเนอร์) · state การลากอยู่ที่นี่ · ยิง API ที่ vm.onReorder · หัวข้อที่ลบแล้ว (กู้คืน)
// แก้ชื่อหัวข้อ = ป๊อปอัป (ชื่อไทย + ชื่ออังกฤษ)
import { useState } from "react";
import { Modal, Popover } from "antd";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
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
  const draggable = canEdit && vm.aspects.length > 1;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const endDrag = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

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
              <span key={a._id} className="inline-flex items-center gap-1.5 rounded-full border border-brown-200 bg-brown-50 px-3 py-1 text-xs text-brown-800">
                <AspectIcon icon={resolveAspectIcon(a.icon, a.aspect_name_eng)} size={13} />
                {a.aspect_name_th}
              </span>
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

      {draggable && <p className="m-0 -mb-2 text-xs text-gray-500">{t("reviewSettings.aspects.reorderHint")}</p>}
      <ul className={`m-0 flex list-none flex-col gap-2 p-0 ${vm.reordering ? "opacity-60" : ""}`}>
        {vm.aspects.map((a) => {
          const iconKey = resolveAspectIcon(a.icon, a.aspect_name_eng);
          return (
            <li
              key={a._id}
              draggable={draggable}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", a._id);
                e.dataTransfer.effectAllowed = "move";
                setDraggingId(a._id);
              }}
              onDragOver={(e) => {
                if (!draggable) return;
                e.preventDefault();
                setDragOverId(a._id);
              }}
              onDragLeave={() => setDragOverId((prev) => (prev === a._id ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingId) vm.onReorder(draggingId, a._id);
                endDrag();
              }}
              onDragEnd={endDrag}
              className={`flex flex-col gap-2 rounded-xl border bg-white p-3 transition-all ${
                dragOverId === a._id && draggingId !== a._id
                  ? "border-brown-400 shadow-md"
                  : a.is_active
                    ? "border-gray-100"
                    : "border-dashed border-gray-200"
              } ${a.is_active ? "" : "opacity-75"} ${draggingId === a._id ? "opacity-40" : ""} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {draggable && <Bars3Icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />}
                <Popover
                  trigger={canEdit ? "click" : []}
                  title={t("reviewSettings.aspects.pickIcon")}
                  content={
                    <div className="grid grid-cols-7 gap-1">
                      {ASPECT_ICON_KEYS.map((k) => (
                        <button key={k} type="button" aria-label={k} onClick={() => vm.onIcon(a, k)}
                          className={`flex h-[36px] w-[36px] items-center justify-center rounded border ${k === iconKey ? "border-brown-700 bg-brown-50" : "border-gray-200 hover:border-gray-400"}`}>
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

                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-brown-800">{a.aspect_name_th}</span>
                  {a.aspect_name_eng && a.aspect_name_eng !== a.aspect_name_th && <span className="truncate text-xs text-gray-500">· {a.aspect_name_eng}</span>}
                  {canEdit && (
                    <Button size="small" type="text" aria-label={t("reviewSettings.aspects.rename")} icon={actionIcon("edit", "small")}
                      onClick={() => vm.startRename(a)} />
                  )}
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{a.is_active ? t("reviewSettings.aspects.shown") : t("reviewSettings.aspects.hidden")}</span>
                  <Switch size="small" aria-label={a.aspect_name_th} checked={a.is_active} disabled={!canEdit} onChange={() => vm.onToggleActive(a)} />
                  {vm.perm.delete && (
                    <ConfirmDeletePopup title={t("reviewSettings.aspects.deleteConfirm", { name: a.aspect_name_th })} onConfirm={() => vm.onDeleteAspect(a)}>
                      <DeleteButton size="small" />
                    </ConfirmDeletePopup>
                  )}
                </span>
              </div>
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
      {/* ป๊อปอัปแก้ชื่อหัวข้อ — รีวิวเดิมเปลี่ยนชื่อตามให้ (backend) */}
      <Modal
        open={!!vm.renaming}
        title={t("reviewSettings.aspects.renameTitle")}
        width={480}
        onCancel={() => !vm.renameSaving && vm.setRenaming(null)}
        onOk={vm.saveRename}
        confirmLoading={vm.renameSaving}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        mask={{ closable: false }}
        destroyOnHidden
      >
        {vm.renaming && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm text-brown-800">
              <span>
                {t("reviewSettings.aspects.nameTh")}
                <span className="text-red-500"> *</span>
              </span>
              <Input
                autoFocus
                value={vm.renaming.th}
                maxLength={50}
                onChange={(e) => vm.setRenaming({ ...vm.renaming!, th: e.target.value })}
                onPressEnter={vm.saveRename}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-brown-800">
              {t("reviewSettings.aspects.nameEng")}
              <Input
                value={vm.renaming.eng}
                maxLength={50}
                onChange={(e) => vm.setRenaming({ ...vm.renaming!, eng: e.target.value })}
                onPressEnter={vm.saveRename}
              />
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
