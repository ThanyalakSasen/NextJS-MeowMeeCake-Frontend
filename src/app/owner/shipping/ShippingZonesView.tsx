"use client";
// View ของ "ค่าจัดส่ง" (เว็บไซต์ · BACKLOG4 F2) — วิธีคิดค่าส่ง 3 ข้อ · เครื่องมือลองเช็กค่าส่ง (จังหวัด + สินค้า) ·
// การ์ดโซนแถวละ 1 ใบ (เห็นจังหวัดครบ · โซนจังหวัดอื่นทั้งหมดอยู่ท้าย · แสดงเป็นตัวอักษรสุดท้าย) + modal เพิ่ม/แก้ไข · ปุ่ม "ตั้งค่าพื้นที่จัดส่งของสินค้า" มุมขวาบน (สวิตช์ส่งทั่วประเทศรายหมวด)
// ปุ่ม "เพิ่มโซน" มุมขวาบนของรายการโซน (2026-10-26) · เพิ่ม/แก้/ลบตามสิทธิ์ shipping.create/update/delete · โซน D ลบไม่ได้
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, Select, Tag } from "@/components/base";
import { CategoryShippingButton } from "@/components/shared/categories";
import { ListPageLayout } from "@/components/shared/layout";
import { ConfirmDeletePopup, LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { DeleteButton, EditButton, actionIcon } from "@/components/shared/actions";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { PROVINCE_OPTIONS } from "@/constants/thaiProvinces";
import { formatCurrency } from "@/i18n/format";
import type { useShippingZonesViewModel } from "./useShippingZonesViewModel";
import { FALLBACK_ZONE, displayZoneCode } from "./shippingZoneForm";
import { NOTICE_TAG, shippingZoneStyle } from "@/constants/enumConfig";

// โมดัลแก้ไขโซน (antd Modal + ฟอร์ม) แยก chunk — โหลดเมื่อเปิดครั้งแรก (โมดัลไม่ render ฝั่ง server อยู่แล้ว)
const ShippingZoneEditModal = dynamic(() => import("./_components/ShippingZoneEditModal").then((m) => m.ShippingZoneEditModal), { ssr: false });

type VM = ReturnType<typeof useShippingZonesViewModel>;

export function ShippingZonesView(vm: VM) {
  const t = useTranslations();
  const modalUsed = useOpenedOnce(!!vm.editing);
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);
  const zoneD = vm.zones.find((z) => z.zone_code === FALLBACK_ZONE);
  /** ตัวอักษรที่แสดง — โซนจังหวัดอื่นทั้งหมดเป็นตัวสุดท้ายเสมอ */
  const show = (code: string) => displayZoneCode(code, vm.zones);

  return (
    <ListPageLayout title={t("shippingZones.title")} actions={<CategoryShippingButton />}>
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── วิธีคิดค่าส่ง 3 ข้อ ── */}
          <Card className="p-4">
            <p className="m-0 mb-2 text-sm font-semibold text-brown-800">{t("shippingZones.how.title")}</p>
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {[
                t("shippingZones.how.step1", { d: zoneD ? money(zoneD.fee) : "—", fallback: show(FALLBACK_ZONE) }),
                t("shippingZones.how.step2"),
                t("shippingZones.how.step3", { province: vm.storeProvince }),
              ].map((text, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-gray-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brown-800 text-xs font-bold text-white">{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </Card>

          {/* ── ลองเช็กค่าส่ง ── */}
          <Card className="flex flex-col gap-3 p-4">
            <div>
              <p className="m-0 text-sm font-semibold text-brown-800">{t("shippingZones.checker.title")}</p>
              <p className="m-0 text-xs text-gray-500">{t("shippingZones.checker.hint")}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[16rem_1fr]">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">{t("shippingZones.checker.province")}</span>
                <Select
                  showSearch
                  allowClear
                  value={vm.checkProvince || undefined}
                  options={PROVINCE_OPTIONS}
                  placeholder={t("shippingZones.checker.placeholder")}
                  aria-label={t("shippingZones.checker.province")}
                  onChange={(v?: string) => vm.setCheckProvince(v ?? "")}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">{t("shippingZones.checker.products")}</span>
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  maxTagCount="responsive"
                  value={vm.checkProducts}
                  options={vm.productOptions}
                  placeholder={t("shippingZones.checker.productsPlaceholder")}
                  aria-label={t("shippingZones.checker.products")}
                  onChange={(v: string[]) => vm.setCheckProducts(v)}
                />
              </label>
            </div>
            {vm.check && (
              <div
                className={`rounded-lg border px-3 py-2.5 text-sm ${
                  vm.check.blocked ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-900"
                }`}
                role="status"
              >
                {vm.check.blocked ? (
                  <>
                    <p className="m-0 font-semibold">{t("shippingZones.checker.blocked", { province: vm.storeProvince })}</p>
                    <p className="m-0 mt-0.5">{t("shippingZones.checker.blockedItems", { items: vm.check.localOnlyNames.join(", "), province: vm.storeProvince })}</p>
                  </>
                ) : (
                  <p className="m-0">
                    {t.rich("shippingZones.checker.ok", {
                      code: show(vm.check.zone.zone_code),
                      label: vm.check.zone.zone_label,
                      fee: money(vm.check.zone.fee),
                      b: (c) => <strong>{c}</strong>,
                    })}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* ── โซน แถวละ 1 ใบ — หัวรายการ: จำนวนโซน (ซ้าย) · ปุ่มเพิ่มโซน (ขวา) ── */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-sm font-semibold text-brown-800">{t("shippingZones.listTitle", { n: vm.zones.length })}</p>
            {vm.perm.create && (
              <Button type="primary" icon={actionIcon("add")} onClick={vm.openAdd}>
                {t("shippingZones.add")}
              </Button>
            )}
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {vm.zones.map((z) => {
              const hit = vm.check && !vm.check.blocked && vm.check.zone.zone_code === z.zone_code;
              return (
                <li key={z.zone_code}>
                  <Card className={`flex flex-col gap-3 p-4 ${hit ? "ring-2 ring-brown-300" : ""}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <Tag color={shippingZoneStyle(z.zone_code).antColor} className="!m-0 font-bold">{show(z.zone_code)}</Tag>
                      <span className="min-w-0 flex-1 font-semibold text-brown-800">{z.zone_label}</span>
                      <span className="text-lg font-bold text-brown-900">{money(z.fee)}</span>
                      {(vm.perm.update || (vm.perm.delete && z.zone_code !== FALLBACK_ZONE)) && (
                        <span className="flex gap-1">
                          {vm.perm.update && <EditButton size="small" onClick={() => vm.openEdit(z)} />}
                          {vm.perm.delete && z.zone_code !== FALLBACK_ZONE && (
                            <ConfirmDeletePopup title={t("shippingZones.deleteConfirm", { code: show(z.zone_code), fallback: show(FALLBACK_ZONE) })} onConfirm={() => vm.onDelete(z)}>
                              <DeleteButton size="small" loading={vm.deletingCode === z.zone_code} />
                            </ConfirmDeletePopup>
                          )}
                        </span>
                      )}
                    </div>
                    {z.zone_code === FALLBACK_ZONE ? (
                      <p className="m-0 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <Tag color={NOTICE_TAG.catchAllZone} className="!m-0">{t("shippingZones.fallbackTag")}</Tag>
                        {t("shippingZones.fallbackHint")}
                      </p>
                    ) : z.provinces.length === 0 ? (
                      <p className="m-0 text-sm text-gray-500">{t("shippingZones.noProvinces")}</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-gray-500">{t("shippingZones.provinceCount", { n: z.provinces.length })}</span>
                        <span className="flex flex-wrap gap-1">
                          {z.provinces.map((p) => (
                            <Tag key={p} className="!m-0">{p}</Tag>
                          ))}
                        </span>
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {modalUsed && <ShippingZoneEditModal {...vm} />}
    </ListPageLayout>
  );
}
