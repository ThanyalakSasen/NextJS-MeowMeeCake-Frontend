"use client";
// ฟอร์มโซนค่าจัดส่ง (ใน modal เพิ่ม/แก้ไข) — ชื่อ · ค่าส่ง · ลำดับ · จังหวัดอื่นทั้งหมด (catch-all) · จังหวัด · เปิดใช้
// ช่องจังหวัด: เลือกจาก 77 จังหวัด หรือพิมพ์ชื่อเรียกอื่นที่ลูกค้าอาจกรอก (เช่น "กทม") แล้วกด Enter
import { useTranslations } from "next-intl";
import { Input, InputNumber, Select, Switch } from "@/components/base";
import { FormField } from "@/components/shared/form";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";
import type { DeliveryZoneInput } from "@/types/deliveryZone";

const PROVINCE_OPTIONS = THAI_PROVINCES.map((p) => ({ value: p, label: p }));

export function DeliveryZoneForm({
  form, errors, otherCatchAll, onChange,
}: {
  form: DeliveryZoneInput;
  errors: Partial<Record<"zone_name" | "fee" | "provinces" | "sort_order", string>>;
  /** ชื่อโซนที่เป็น "จังหวัดอื่นทั้งหมด" อยู่ตอนนี้ (ถ้าเป็นโซนอื่น) */
  otherCatchAll: string | null;
  onChange: (f: DeliveryZoneInput) => void;
}) {
  const t = useTranslations();
  const set = <K extends keyof DeliveryZoneInput>(k: K, v: DeliveryZoneInput[K]) => onChange({ ...form, [k]: v });

  return (
    <div className="flex flex-col gap-4">
      <FormField label={t("deliveryZones.fields.name")} required error={errors.zone_name}>
        <Input value={form.zone_name} maxLength={200} placeholder={t("deliveryZones.fields.namePlaceholder")}
          onChange={(e) => set("zone_name", e.target.value)} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t("deliveryZones.fields.fee")} required error={errors.fee}>
          <InputNumber className="!w-full" min={0} step={10} precision={2} value={form.fee} suffix={t("common.currencySymbol")}
            onChange={(v) => set("fee", typeof v === "number" ? v : 0)} />
        </FormField>
        <FormField label={t("deliveryZones.fields.sortOrder")} error={errors.sort_order}>
          <InputNumber className="!w-full" precision={0} value={form.sort_order}
            onChange={(v) => set("sort_order", typeof v === "number" ? v : 0)} />
        </FormField>
      </div>
      <p className="-mt-2 m-0 text-xs text-gray-500">{t("deliveryZones.fields.sortOrderHint")}</p>

      <div className="flex flex-col gap-1 rounded-lg border border-gray-100 p-3">
        <span className="flex items-center gap-2">
          <Switch size="small" checked={form.is_catch_all} aria-label={t("deliveryZones.fields.catchAll")}
            onChange={(v) => set("is_catch_all", v)} />
          <span className="text-sm text-brown-800">{t("deliveryZones.fields.catchAll")}</span>
        </span>
        <span className="text-xs text-gray-500">{t("deliveryZones.fields.catchAllHint")}</span>
        {form.is_catch_all && otherCatchAll && (
          <span className="text-xs text-amber-600">{t("deliveryZones.fields.catchAllReplaces", { name: otherCatchAll })}</span>
        )}
      </div>

      {!form.is_catch_all && (
        <FormField label={t("deliveryZones.fields.provinces")} required error={errors.provinces}>
          <Select
            mode="tags"
            className="w-full"
            value={form.provinces}
            options={PROVINCE_OPTIONS}
            tokenSeparators={[","]}
            placeholder={t("deliveryZones.fields.provincesPlaceholder")}
            aria-label={t("deliveryZones.fields.provinces")}
            onChange={(v: string[]) => set("provinces", v)}
          />
        </FormField>
      )}
      {!form.is_catch_all && <p className="-mt-2 m-0 text-xs text-gray-500">{t("deliveryZones.fields.provincesHint")}</p>}

      <span className="flex items-center gap-2">
        <Switch size="small" checked={form.is_active} aria-label={t("deliveryZones.fields.active")}
          onChange={(v) => set("is_active", v)} />
        <span className="text-sm text-brown-800">{t("deliveryZones.fields.active")}</span>
      </span>
    </div>
  );
}
