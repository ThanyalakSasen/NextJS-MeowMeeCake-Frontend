"use client";
// View ของ "ค่าจัดส่งหน้าร้านออนไลน์" (BACKLOG4 F2) — ใช้กับอะไร · ตรวจจังหวัด · ตารางโซน A–D + modal แก้ไข
// ปุ่มแก้ไขตามสิทธิ์ store_info.update · โซนคงที่ 4 โซน (ไม่มีเพิ่ม/ลบ)
import { Modal } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { Card, Select, Tag } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { DataTable } from "@/components/shared/data";
import { LoadingSpin } from "@/components/shared/feedback";
import { EditButton, RetryButton, modalButtonIcons } from "@/components/shared/actions";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";
import { formatCurrency } from "@/i18n/format";
import type { ShippingZone } from "@/types/shippingZone";
import type { useShippingZonesViewModel } from "./useShippingZonesViewModel";
import { FALLBACK_ZONE } from "./shippingZoneForm";
import { ShippingZoneFormFields } from "./_components/ShippingZoneFormFields";
import { NOTICE_TAG, SHIPPING_ZONE_CONFIG } from "@/constants/enumConfig";

type VM = ReturnType<typeof useShippingZonesViewModel>;
const PROVINCES_SHOWN = 8;
const PROVINCE_OPTIONS = THAI_PROVINCES.map((p) => ({ value: p, label: p }));

export function ShippingZonesView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);

  return (
    <ListPageLayout title={t("shippingZones.title")} description={t("shippingZones.description")}>
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
            <p className="m-0">{t("shippingZones.usage")}</p>
            <p className="m-0">{t("shippingZones.scopeNote")}</p>
          </div>

          <Card className="flex flex-col gap-3 p-4">
            <p className="m-0 text-sm font-semibold text-brown-800">{t("shippingZones.checker.title")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                showSearch
                allowClear
                className="w-full sm:w-64"
                value={vm.checkProvince || undefined}
                options={PROVINCE_OPTIONS}
                placeholder={t("shippingZones.checker.placeholder")}
                aria-label={t("shippingZones.checker.title")}
                onChange={(v?: string) => vm.setCheckProvince(v ?? "")}
              />
              {vm.checkResult && (
                <span className="text-sm text-gray-700">
                  {t("shippingZones.checker.result", { code: vm.checkResult.zone_code, fee: money(vm.checkResult.fee) })}
                </span>
              )}
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-4">
            <DataTable<ShippingZone>
              inCard
              rows={vm.zones}
              rowKey={(z) => z.zone_code}
              emptyText={t("common.noData")}
              columns={[
                {
                  key: "code",
                  title: t("shippingZones.fields.code"),
                  width: 80,
                  align: "center",
                  render: (z) => <Tag color={SHIPPING_ZONE_CONFIG[z.zone_code].antColor} className="!m-0 font-bold">{z.zone_code}</Tag>,
                },
                {
                  key: "label",
                  title: t("shippingZones.fields.label"),
                  width: 240,
                  render: (z) => <span className="font-semibold text-brown-800">{z.zone_label}</span>,
                },
                {
                  key: "provinces",
                  title: t("shippingZones.fields.provinces"),
                  render: (z) =>
                    z.zone_code === FALLBACK_ZONE ? (
                      <Tag color={NOTICE_TAG.catchAllZone} className="!m-0">{t("shippingZones.fallbackTag")}</Tag>
                    ) : z.provinces.length === 0 ? (
                      <span className="text-gray-500">{t("shippingZones.noProvinces")}</span>
                    ) : (
                      <span className="flex flex-wrap gap-1">
                        {z.provinces.slice(0, PROVINCES_SHOWN).map((p) => (
                          <Tag key={p} className="!m-0">{p}</Tag>
                        ))}
                        {z.provinces.length > PROVINCES_SHOWN && (
                          <Tag className="!m-0" title={z.provinces.slice(PROVINCES_SHOWN).join(", ")}>
                            {t("shippingZones.moreProvinces", { n: z.provinces.length - PROVINCES_SHOWN })}
                          </Tag>
                        )}
                      </span>
                    ),
                },
                { key: "fee", title: t("shippingZones.fields.fee"), width: 110, align: "right", render: (z) => money(z.fee) },
              ]}
              actions={vm.perm.update ? (z) => <EditButton size="small" onClick={() => vm.openEdit(z)} /> : undefined}
            />
          </Card>
        </div>
      )}

      <Modal
        open={!!vm.editing}
        title={vm.editing ? t("shippingZones.editTitle", { code: vm.editing.code }) : ""}
        width={640}
        onCancel={vm.closeEdit}
        onOk={vm.onSave}
        confirmLoading={vm.saving}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        {...modalButtonIcons("save")}
        destroyOnHidden
      >
        {vm.editing && (
          <ShippingZoneFormFields
            code={vm.editing.code}
            form={vm.editing.form}
            errors={vm.errors}
            taken={vm.takenProvinces}
            onChange={vm.setForm}
          />
        )}
      </Modal>
    </ListPageLayout>
  );
}
