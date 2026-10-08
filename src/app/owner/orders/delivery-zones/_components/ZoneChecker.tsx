"use client";
// ตรวจจังหวัด → ใช้โซนไหน ค่าส่งเท่าไร (กติกาเดียวกับ backend — deliveryZoneForm.resolveZone)
import { useLocale, useTranslations } from "next-intl";
import { Card, Select } from "@/components/base";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";
import { formatCurrency } from "@/i18n/format";
import type { DeliveryZone } from "@/types/deliveryZone";

const OPTIONS = THAI_PROVINCES.map((p) => ({ value: p, label: p }));

export function ZoneChecker({
  value, onChange, result,
}: {
  value: string;
  onChange: (v: string) => void;
  result: { zone: DeliveryZone | null; freeMin: number | null } | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="m-0 text-sm font-semibold text-brown-800">{t("deliveryZones.checker.title")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Select
          showSearch
          allowClear
          className="w-full sm:w-64"
          value={value || undefined}
          options={OPTIONS}
          placeholder={t("deliveryZones.checker.placeholder")}
          aria-label={t("deliveryZones.checker.title")}
          onChange={(v?: string) => onChange(v ?? "")}
        />
        {result && (
          <span className="text-sm text-gray-700">
            {result.zone
              ? t("deliveryZones.checker.result", { zone: result.zone.zone_name, fee: formatCurrency(result.zone.fee, locale) })
              : t("deliveryZones.checker.fallback")}
          </span>
        )}
      </div>
      {result && result.freeMin != null && (
        <span className="text-xs text-gray-500">{t("deliveryZones.checker.freeNote", { amount: formatCurrency(result.freeMin, locale) })}</span>
      )}
    </Card>
  );
}
