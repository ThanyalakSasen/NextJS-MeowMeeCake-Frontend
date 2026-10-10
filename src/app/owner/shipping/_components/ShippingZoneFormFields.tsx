"use client";
// ฟอร์มโซนค่าส่งเว็บ (ใน modal แก้ไข) — ชื่อโซน · ค่าส่ง · จังหวัด (เลือกจาก 77 จังหวัดเท่านั้น · จังหวัดที่อยู่โซนอื่นเลือกไม่ได้)
// โซน D ไม่มีช่องจังหวัด — ใช้กับจังหวัดที่ไม่อยู่ในโซน A–C ทั้งหมด
import { useTranslations } from "next-intl";
import { Input, InputNumber, Select } from "@/components/base";
import { FormField } from "@/components/shared/form";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";
import type { ShippingZoneCode } from "@/types/shippingZone";
import { FALLBACK_ZONE, type ShippingZoneForm } from "../shippingZoneForm";

export function ShippingZoneFormFields({
  code, form, errors, taken, onChange,
}: {
  code: ShippingZoneCode;
  form: ShippingZoneForm;
  errors: Partial<Record<"zone_label" | "fee", string>>;
  /** จังหวัด → โซนอื่นที่ใช้อยู่ */
  taken: Map<string, ShippingZoneCode>;
  onChange: (f: ShippingZoneForm) => void;
}) {
  const t = useTranslations();
  const set = <K extends keyof ShippingZoneForm>(k: K, v: ShippingZoneForm[K]) => onChange({ ...form, [k]: v });
  const options = THAI_PROVINCES.map((p) => {
    const owner = taken.get(p);
    return { value: p, label: owner ? t("shippingZones.fields.provinceTaken", { province: p, code: owner }) : p, disabled: !!owner };
  });

  return (
    <div className="flex flex-col gap-4">
      <FormField label={t("shippingZones.fields.label")} required error={errors.zone_label}>
        <Input value={form.zone_label} maxLength={120} onChange={(e) => set("zone_label", e.target.value)} />
      </FormField>

      <FormField label={t("shippingZones.fields.fee")} required error={errors.fee}>
        <InputNumber className="!w-full sm:!w-48" min={0} step={10} precision={2} value={form.fee} suffix={t("common.currencySymbol")}
          onChange={(v) => set("fee", typeof v === "number" ? v : 0)} />
      </FormField>

      {code === FALLBACK_ZONE ? (
        <p className="m-0 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">{t("shippingZones.fallbackHint")}</p>
      ) : (
        <>
          <FormField label={t("shippingZones.fields.provinces")}>
            <Select
              mode="multiple"
              showSearch
              className="w-full"
              value={form.provinces}
              options={options}
              placeholder={t("shippingZones.fields.provincesPlaceholder")}
              aria-label={t("shippingZones.fields.provinces")}
              onChange={(v: string[]) => set("provinces", v)}
            />
          </FormField>
          <p className="-mt-2 m-0 text-xs text-gray-500">{t("shippingZones.fields.provincesHint")}</p>
        </>
      )}
    </div>
  );
}
