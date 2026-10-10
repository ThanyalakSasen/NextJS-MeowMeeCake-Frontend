"use client";
// View ของ "โซนค่าจัดส่ง" (BACKLOG4 I8) — ใช้กับอะไร · ค่าส่งที่ใช้อยู่ + คำเตือน · ตรวจจังหวัด · ตารางโซน + modal เพิ่ม/แก้ · โซนที่ลบแล้ว (กู้คืน)
// ปุ่มเพิ่ม/แก้/ลบ/กู้คืน + สวิตช์เปิดใช้ ตามสิทธิ์ orders.create/update/delete
import { Modal } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, Switch, Tag } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { DataTable } from "@/components/shared/data";
import { ConfirmDeletePopup, LoadingSpin } from "@/components/shared/feedback";
import { DeleteButton, EditButton, RetryButton, actionIcon, modalButtonIcons } from "@/components/shared/actions";
import { formatCurrency } from "@/i18n/format";
import type { DeliveryZone } from "@/types/deliveryZone";
import type { useDeliveryZonesViewModel } from "./useDeliveryZonesViewModel";
import { DeliveryZoneForm } from "./_components/DeliveryZoneForm";
import { ZoneChecker } from "./_components/ZoneChecker";

type VM = ReturnType<typeof useDeliveryZonesViewModel>;
const PROVINCES_SHOWN = 8;
const WARN = "m-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800";

export function DeliveryZonesView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);

  return (
    <ListPageLayout
      title={t("deliveryZones.title")}
      description={t("deliveryZones.description")}
      actions={
        vm.perm.create && !vm.isLoading && !vm.isError ? (
          <Button type="primary" icon={actionIcon("add")} onClick={vm.openAdd}>
            {t("deliveryZones.add")}
          </Button>
        ) : undefined
      }
    >
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <RetryButton onClick={() => vm.refetch()} />
        </div>
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 rounded-xl border border-brown-100 bg-brown-50 px-4 py-3 text-sm leading-relaxed text-brown-800">
            <p className="m-0">{t("deliveryZones.usage")}</p>
            {vm.overview && <p className="m-0">{t("deliveryZones.freeShipping", { amount: money(vm.overview.free_shipping_min) })}</p>}
          </div>

          {vm.overview?.source === "env-fallback" && (
            <p className={WARN}>
              {t("deliveryZones.warnings.fallback", { zones: vm.overview.zones.map((z) => `${z.name} ${money(z.fee)}`).join(" · ") })}
            </p>
          )}
          {vm.activeCount > 0 && !vm.hasCatchAll && <p className={WARN}>{t("deliveryZones.warnings.noCatchAll")}</p>}
          {vm.duplicates.length > 0 && (
            <div className={WARN}>
              <p className="m-0">{t("deliveryZones.warnings.duplicates")}</p>
              <ul className="m-0 mt-1 list-disc pl-5">
                {vm.duplicates.map((d) => (
                  <li key={d.province}>
                    {t("deliveryZones.warnings.duplicateItem", { province: d.province, winner: d.winner, others: d.others.join(", ") })}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ZoneChecker value={vm.checkProvince} onChange={vm.setCheckProvince} result={vm.checkResult} />

          <Card className="flex flex-col gap-3 p-4">
            <p className="m-0 text-sm font-semibold text-brown-800">{t("deliveryZones.listTitle", { n: vm.zones.length })}</p>
            <DataTable<DeliveryZone>
              inCard
              rows={vm.zones}
              rowKey={(z) => z._id}
              emptyText={t("deliveryZones.empty")}
              columns={[
                { key: "order", title: t("deliveryZones.fields.sortOrderShort"), width: 70, align: "center", render: (z) => z.sort_order },
                {
                  key: "name",
                  title: t("deliveryZones.fields.name"),
                  width: 200,
                  render: (z) => <span className={`font-semibold ${z.is_active ? "text-brown-800" : "text-gray-400"}`}>{z.zone_name}</span>,
                },
                {
                  key: "provinces",
                  title: t("deliveryZones.fields.provinces"),
                  render: (z) =>
                    z.is_catch_all ? (
                      <Tag color="gold" className="!m-0">{t("deliveryZones.catchAllTag")}</Tag>
                    ) : (
                      <span className="flex flex-wrap gap-1">
                        {z.provinces.slice(0, PROVINCES_SHOWN).map((p) => (
                          <Tag key={p} className="!m-0">{p}</Tag>
                        ))}
                        {z.provinces.length > PROVINCES_SHOWN && (
                          <Tag className="!m-0" title={z.provinces.slice(PROVINCES_SHOWN).join(", ")}>
                            {t("deliveryZones.moreProvinces", { n: z.provinces.length - PROVINCES_SHOWN })}
                          </Tag>
                        )}
                      </span>
                    ),
                },
                { key: "fee", title: t("deliveryZones.fields.fee"), width: 110, align: "right", render: (z) => money(z.fee) },
                {
                  key: "active",
                  title: t("deliveryZones.fields.active"),
                  width: 90,
                  align: "center",
                  render: (z) => (
                    <Switch
                      size="small"
                      checked={z.is_active}
                      disabled={!vm.perm.update}
                      loading={vm.togglingId === z._id}
                      aria-label={t("deliveryZones.fields.activeAria", { name: z.zone_name })}
                      onChange={() => vm.onToggleActive(z)}
                    />
                  ),
                },
              ]}
              actions={
                vm.perm.update || vm.perm.delete
                  ? (z) => (
                      <div className="flex justify-end gap-1">
                        {vm.perm.update && <EditButton size="small" onClick={() => vm.openEdit(z)} />}
                        {vm.perm.delete && (
                          <ConfirmDeletePopup title={t("deliveryZones.deleteConfirm", { name: z.zone_name })} onConfirm={() => vm.onDelete(z)}>
                            <DeleteButton size="small" />
                          </ConfirmDeletePopup>
                        )}
                      </div>
                    )
                  : undefined
              }
            />
          </Card>

          {vm.deleted.length > 0 && (
            <Card className="flex flex-col gap-2 p-4">
              <p className="m-0 text-sm font-semibold text-gray-600">{t("deliveryZones.deletedTitle", { n: vm.deleted.length })}</p>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {vm.deleted.map((z) => (
                  <li key={z._id} className="flex items-center justify-between gap-2 text-sm text-gray-500">
                    <span>
                      {z.zone_name} · {money(z.fee)}
                    </span>
                    {vm.perm.update && (
                      <Button size="small" loading={vm.restoringId === z._id} onClick={() => vm.onRestore(z)}>
                        {t("deliveryZones.restore")}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      <Modal
        open={!!vm.editing}
        title={vm.editing?.id ? t("deliveryZones.editTitle") : t("deliveryZones.addTitle")}
        width={640}
        onCancel={vm.closeEdit}
        onOk={vm.onSave}
        confirmLoading={vm.saving}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        {...modalButtonIcons("save")}
        destroyOnHidden
      >
        {vm.editing && <DeliveryZoneForm form={vm.editing.form} errors={vm.errors} otherCatchAll={vm.otherCatchAll} onChange={vm.setForm} />}
      </Modal>
    </ListPageLayout>
  );
}
