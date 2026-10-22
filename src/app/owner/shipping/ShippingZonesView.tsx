"use client";
// View ของ "ค่าจัดส่งหน้าร้านออนไลน์" (BACKLOG4 F2) — ใช้กับอะไร · ตรวจจังหวัด · ตารางโซน A–D + modal แก้ไข
// + ปุ่ม "จัดส่งนอกจังหวัด" มุมขวาบน (สวิตช์ส่งทั่วประเทศรายหมวด — ปุ่มเดียวกับหน้าจัดการข้อมูลสินค้า)
// แก้ไขตามสิทธิ์ store_info.update · โซนคงที่ 4 โซน (ไม่มีเพิ่ม/ลบ)
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, Select, Tag } from "@/components/base";
import { CategoryShippingButton } from "@/components/shared/categories";
import { ListPageLayout } from "@/components/shared/layout";
import { DataTable } from "@/components/shared/data";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { DeleteButton, EditButton, actionIcon } from "@/components/shared/actions";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { PROVINCE_OPTIONS } from "@/constants/thaiProvinces";
import { formatCurrency } from "@/i18n/format";
import type { ShippingZone } from "@/types/shippingZone";
import type { useShippingZonesViewModel } from "./useShippingZonesViewModel";
import { FALLBACK_ZONE } from "./shippingZoneForm";
import { NOTICE_TAG, shippingZoneStyle } from "@/constants/enumConfig";

// โมดัลแก้ไขโซน (antd Modal + ฟอร์ม) แยก chunk — โหลดเมื่อเปิดครั้งแรก (โมดัลไม่ render ฝั่ง server อยู่แล้ว)
const ShippingZoneEditModal = dynamic(() => import("./_components/ShippingZoneEditModal").then((m) => m.ShippingZoneEditModal), { ssr: false });

type VM = ReturnType<typeof useShippingZonesViewModel>;
const PROVINCES_SHOWN = 8;

export function ShippingZonesView(vm: VM) {
  const t = useTranslations();
  const modalUsed = useOpenedOnce(!!vm.editing);
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);

  return (
    <ListPageLayout
      title={t("shippingZones.title")}
      actions={
        <>
          <CategoryShippingButton />
          {vm.perm.create && (
            <Button type="primary" icon={actionIcon("add")} onClick={vm.openCreate}>
              {t("shippingZones.add")}
            </Button>
          )}
        </>
      }
    >
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
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
                  render: (z) => <Tag color={shippingZoneStyle(z.zone_code).antColor} className="!m-0 font-bold">{z.zone_code}</Tag>,
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
              actions={
                vm.perm.update || vm.perm.delete
                  ? (z) => (
                      <span className="inline-flex items-center gap-1">
                        {vm.perm.update && <EditButton size="small" onClick={() => vm.openEdit(z)} />}
                        {vm.canRemove(z) && <DeleteButton size="small" onClick={() => void vm.onRemove(z)} />}
                      </span>
                    )
                  : undefined
              }
            />
          </Card>
        </div>
      )}

      {modalUsed && <ShippingZoneEditModal {...vm} />}
    </ListPageLayout>
  );
}
