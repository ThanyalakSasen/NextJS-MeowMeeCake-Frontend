"use client";
// ที่อยู่ร้าน + พิกัด (/admin/store-settings · เจ้าของร้าน) — จังหวัด = ขอบเขตจัดส่งของสินค้าที่ส่งทั่วประเทศไม่ได้
// แสดงในหน้า "ติดต่อเรา" + ปุ่มเปิดแผนที่ · อยู่ในการ์ดเดียวกับหน้าร้านประจำสัปดาห์ (บันทึกพร้อมกัน)
import { useTranslations } from "next-intl";
import { Input } from "@/components/base";
import { FormField } from "@/components/shared/form";
import type { StoreSettings } from "@/types/storeAdmin";
import { ADDRESS_FIELDS } from "../storeInfoForm";
import { CoordinateInput } from "./CoordinateInput";

export function StoreAddressFields({ address, editable, onField, onCoordinates, onResolveShortLink, fieldError }: {
  address: StoreSettings;
  editable: boolean;
  onField: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void;
  onCoordinates: (lat: number | null, lng: number | null) => void;
  onResolveShortLink: (url: string) => Promise<{ lat: number; lng: number }>;
  fieldError: (name: string) => string | undefined;
}) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="m-0 text-sm font-semibold text-brown-800">{t("storeInfo.address.title")}</p>
        <p className="m-0 text-xs text-gray-500">{t("storeInfo.address.hint")}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ADDRESS_FIELDS.map((key) => (
          <div key={key} className={key === "house_no" ? "sm:col-span-2" : undefined}>
            <FormField label={t(`storeInfo.address.${key}`)} required error={fieldError(key)}>
              <Input
                value={address[key]}
                disabled={!editable}
                maxLength={key === "zip_code" ? 5 : 200}
                inputMode={key === "zip_code" ? "numeric" : undefined}
                status={fieldError(key) ? "error" : undefined}
                placeholder={editable ? t(`storeInfo.address.${key}Placeholder`) : t("storeInfo.notSet")}
                onChange={(e) => onField(key, e.target.value)}
              />
            </FormField>
          </div>
        ))}
      </div>
      <FormField label={t("storeInfo.address.coordinates")}>
        <CoordinateInput
          lat={address.latitude}
          lng={address.longitude}
          disabled={!editable}
          onChange={onCoordinates}
          onResolveShortLink={onResolveShortLink}
        />
      </FormField>
      {editable && <p className="m-0 text-xs text-gray-500">{t("storeInfo.address.coordinatesHint")}</p>}
    </div>
  );
}
