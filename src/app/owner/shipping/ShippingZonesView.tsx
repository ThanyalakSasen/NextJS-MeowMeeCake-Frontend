"use client";
// View ของ "ค่าจัดส่ง (ลูกค้าสั่งผ่านเว็บ)" (BACKLOG4 F2) — บนลงล่าง:
//   วิธีคิดค่าส่ง (3 ข้อสั้น) → ลองเช็กค่าส่งตามจังหวัด → โซนค่าจัดส่ง (การ์ดรายโซน แถวละ 1 · ปุ่ม "เพิ่มโซน" มุมขวาบนของหัวข้อโซน)
// ปุ่ม "ตั้งค่าส่งนอกจังหวัด" มุมขวาบนของหน้า (สวิตช์ส่งทั่วประเทศรายหมวด — ปุ่มเดียวกับหน้าจัดการข้อมูลสินค้า)
// เพิ่ม/แก้/ลบตามสิทธิ์ store_info · โซน D = จังหวัดที่ไม่อยู่ในโซนอื่น (ลบไม่ได้)
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { MapIcon, MapPinIcon, TruckIcon } from "@heroicons/react/24/outline";
import { Button, Card, Select, Tag } from "@/components/base";
import { CategoryShippingButton } from "@/components/shared/categories";
import { ListPageLayout } from "@/components/shared/layout";
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
const PROVINCES_SHOWN = 12;

/** หัวข้อของแต่ละส่วน — ไอคอน + ชื่อ + คำอธิบายสั้น · action = ปุ่มมุมขวาบน */
function SectionHead({ icon: Icon, title, hint, action }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brown-50 text-brown-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="m-0 text-base font-semibold text-brown-900">{title}</h2>
          {hint && <p className="m-0 text-sm text-gray-500">{hint}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function ShippingZonesView(vm: VM) {
  const t = useTranslations();
  const modalUsed = useOpenedOnce(!!vm.editing);
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);
  // ข้อ 2 ใช้ชื่อจริงของโซน D (จังหวัดที่ไม่อยู่ในโซนอื่น)
  const fallback = vm.zones.find((z) => z.zone_code === FALLBACK_ZONE);
  const fallbackName = fallback ? t("shippingZones.zoneNamed", { code: fallback.zone_code, name: fallback.zone_label }) : t("shippingZones.zoneBadge", { code: FALLBACK_ZONE });
  const steps = [t("shippingZones.how.step1"), t("shippingZones.how.step2", { zone: fallbackName }), t("shippingZones.how.step3")];

  return (
    <ListPageLayout title={t("shippingZones.title")} actions={<CategoryShippingButton />}>
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <div className="flex flex-col gap-5">
          {/* แถวละ 1 การ์ด: วิธีคิดค่าส่ง → ลองเช็กค่าส่ง */}
          <div className="flex flex-col gap-5">
            {/* วิธีคิดค่าส่ง — 3 ข้อสั้น แทนย่อหน้ายาว */}
            <Card className="flex flex-col gap-3 p-5">
              <SectionHead icon={TruckIcon} title={t("shippingZones.how.title")} />
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-gray-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brown-800 text-xs font-bold text-white">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <p className="m-0 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">{t("shippingZones.scopeNote")}</p>
            </Card>

            {/* ลองเช็กค่าส่ง — ผลเป็นป้ายเด่น */}
            <Card className="flex flex-col gap-3 p-5">
              <SectionHead icon={MapPinIcon} title={t("shippingZones.checker.title")} hint={t("shippingZones.checker.hint")} />
              <Select
                showSearch
                allowClear
                className="w-full"
                value={vm.checkProvince || undefined}
                options={PROVINCE_OPTIONS}
                placeholder={t("shippingZones.checker.placeholder")}
                aria-label={t("shippingZones.checker.title")}
                onChange={(v?: string) => vm.setCheckProvince(v ?? "")}
              />
              {vm.checkResult ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brown-100 bg-brown-50 px-4 py-3">
                  <Tag color={shippingZoneStyle(vm.checkResult.zone_code).antColor} className="!m-0 font-bold">
                    {t("shippingZones.zoneBadge", { code: vm.checkResult.zone_code })}
                  </Tag>
                  <span className="min-w-0 flex-1 truncate text-sm text-brown-800">{vm.checkResult.zone_label}</span>
                  <span className="text-lg font-semibold text-brown-900">{money(vm.checkResult.fee)}</span>
                </div>
              ) : (
                <p className="m-0 text-xs text-gray-500">{t("shippingZones.checker.empty")}</p>
              )}
            </Card>
          </div>

          {/* โซนค่าจัดส่ง — ปุ่มเพิ่มโซนมุมขวาบนของหัวข้อนี้ */}
          <section className="flex flex-col gap-3">
            <SectionHead
              icon={MapIcon}
              title={t("shippingZones.zonesTitle", { n: vm.zones.length })}
              hint={t("shippingZones.zonesHint")}
              action={
                vm.perm.create && (
                  <Button type="primary" icon={actionIcon("add")} onClick={vm.openCreate}>
                    {t("shippingZones.add")}
                  </Button>
                )
              }
            />
            {vm.zones.length === 0 ? (
              <Card className="p-6 text-center text-sm text-gray-500">{t("common.noData")}</Card>
            ) : (
              <div className="flex flex-col gap-3">
                {vm.zones.map((z) => (
                  <ZoneCard key={z.zone_code} z={z} vm={vm} money={money} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {modalUsed && <ShippingZoneEditModal {...vm} />}
    </ListPageLayout>
  );
}

/** การ์ด 1 โซน — รหัส + ชื่อ · ค่าส่งตัวใหญ่ · จังหวัด · ปุ่มแก้ไข/ลบ */
function ZoneCard({ z, vm, money }: { z: ShippingZone; vm: VM; money: (n: number) => string }) {
  const t = useTranslations();
  const fallback = z.zone_code === FALLBACK_ZONE;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Tag color={shippingZoneStyle(z.zone_code).antColor} className="!m-0 font-bold">
            {t("shippingZones.zoneBadge", { code: z.zone_code })}
          </Tag>
          <span className="truncate font-semibold text-brown-800">{z.zone_label}</span>
        </div>
        <div className="shrink-0 text-right">
          <p className="m-0 text-xl font-semibold text-brown-900">{money(z.fee)}</p>
          <p className="m-0 text-xs text-gray-500">{t("shippingZones.perOrder")}</p>
        </div>
      </div>

      <div className="min-h-[28px]">
        {fallback ? (
          <Tag color={NOTICE_TAG.catchAllZone} className="!m-0">{t("shippingZones.fallbackTag")}</Tag>
        ) : z.provinces.length === 0 ? (
          <span className="text-sm text-amber-700">{t("shippingZones.noProvinces")}</span>
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
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-500">
          {fallback ? t("shippingZones.fallbackShort") : t("shippingZones.provinceCount", { n: z.provinces.length })}
        </span>
        <span className="inline-flex items-center gap-1">
          {vm.perm.update && <EditButton size="small" onClick={() => vm.openEdit(z)} />}
          {vm.canRemove(z) && <DeleteButton size="small" onClick={() => void vm.onRemove(z)} />}
        </span>
      </div>
    </Card>
  );
}
