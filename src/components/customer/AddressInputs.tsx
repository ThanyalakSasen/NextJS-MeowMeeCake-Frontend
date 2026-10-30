"use client";
// ─────────────────────────────────────────────────────────────
// ช่องกรอกที่อยู่ลูกค้า (สมุดที่อยู่ + ฟอร์มที่อยู่ตอน checkout ใช้ร่วมกัน)
// - แจ้งเตือนอยู่ใต้ช่องที่ผิดแต่ละช่อง (เดิมรวมเป็นข้อความเดียวท้ายฟอร์ม — ไม่รู้ว่าช่องไหน)
// - จังหวัด = พิมพ์ค้นหาแล้วเลือกจาก 77 จังหวัดจริง (SearchPicker — เลือกได้เฉพาะชื่อในรายการ ไม่สะกดผิดจนคิดค่าส่งผิดโซน)
// - แสดงแจ้งเตือนเมื่อช่องนั้นถูกแก้แล้ว หรือกดบันทึกแล้ว (showAll) — เปิดฟอร์มใหม่ไม่ขึ้นแดงทั้งฟอร์ม
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useTranslations } from "next-intl";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";
import { shopInput } from "@/components/customer/shopStyles";
import SearchPicker from "@/components/customer/SearchPicker";

export const ADDRESS_ZIP_RE = /^\d{5}$/;

export interface AddressValues {
  house_no: string;
  sub_district: string;
  district: string;
  province: string;
  zip_code: string;
}
export type AddressKey = keyof AddressValues;

type LabelKey = "houseNoFull" | "houseNo" | "subDistrict" | "district" | "province" | "zipCode";

export const ADDRESS_FIELDS: { key: AddressKey; labelKey: LabelKey; max: number; wide?: boolean }[] = [
  { key: "house_no", labelKey: "houseNoFull", max: 200, wide: true },
  { key: "sub_district", labelKey: "subDistrict", max: 120 },
  { key: "district", labelKey: "district", max: 120 },
  { key: "province", labelKey: "province", max: 120 },
  { key: "zip_code", labelKey: "zipCode", max: 5 },
];

/** ข้อความผิดของแต่ละช่อง (ว่าง = ไม่มีปัญหา) */
export function useAddressErrors() {
  const t = useTranslations("shop.address");
  return (v: AddressValues): Partial<Record<AddressKey, string>> => {
    const e: Partial<Record<AddressKey, string>> = {};
    for (const f of ADDRESS_FIELDS) {
      if (!String(v[f.key] ?? "").trim()) e[f.key] = f.key === "province" ? t("provinceRequired") : t("fieldRequired", { field: t(f.labelKey) });
    }
    if (!e.zip_code && !ADDRESS_ZIP_RE.test(v.zip_code.trim())) e.zip_code = t("zipInvalid");
    return e;
  };
}

/** แท็กช่องที่ผู้ใช้แตะแล้ว — แจ้งเตือนเฉพาะช่องที่แก้แล้ว (หรือทั้งหมดเมื่อกดบันทึก) */
export function useTouched() {
  const [touched, setTouched] = useState<Partial<Record<AddressKey, boolean>>>({});
  const [showAll, setShowAll] = useState(false);
  return {
    visible: (k: AddressKey) => showAll || !!touched[k],
    touch: (k: AddressKey) => setTouched((s) => (s[k] ? s : { ...s, [k]: true })),
    revealAll: () => setShowAll(true),
    /** เปิดฟอร์มใหม่ = เริ่มนับใหม่ */
    reset: () => {
      setTouched({});
      setShowAll(false);
    },
  };
}

export function AddressInputs({
  values,
  onChange,
  errors,
  visible,
  onTouch,
  houseLabelKey = "houseNoFull",
  housePlaceholder,
}: {
  values: AddressValues;
  onChange: (key: AddressKey, value: string) => void;
  errors: Partial<Record<AddressKey, string>>;
  visible: (k: AddressKey) => boolean;
  onTouch: (k: AddressKey) => void;
  houseLabelKey?: "houseNoFull" | "houseNo";
  housePlaceholder?: string;
}) {
  const t = useTranslations("shop.address");
  const current = values.province.trim();

  return (
    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      {ADDRESS_FIELDS.map((f) => {
        const id = `addr-${f.key}`;
        const err = visible(f.key) ? errors[f.key] : undefined;
        const label = t(f.key === "house_no" ? houseLabelKey : f.labelKey);
        const cls = `${shopInput} ${err ? "!border-red-400 focus:!ring-red-200" : ""}`;
        return (
          <div key={f.key} className={`space-y-1 ${f.wide ? "sm:col-span-2" : ""}`}>
            {/* ทุกช่องที่อยู่บังคับกรอก — * แดง */}
            <label htmlFor={id} className="block text-xs font-semibold text-stone-600">
              {label}
              <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
            </label>
            {f.key === "province" ? (
              <SearchPicker
                id={id}
                options={THAI_PROVINCES}
                value={current}
                onPick={(p) => {
                  onChange("province", p);
                  onTouch("province");
                }}
                onBlurField={() => onTouch("province")}
                placeholder={t("provincePick")}
                label={label}
                emptyText={t("provinceNoMatch")}
                invalid={!!err}
                inputClassName={shopInput}
              />
            ) : (
              <input
                id={id}
                className={cls}
                value={values[f.key]}
                maxLength={f.max}
                aria-invalid={!!err}
                aria-describedby={err ? `${id}-err` : undefined}
                placeholder={f.key === "house_no" && housePlaceholder ? housePlaceholder : f.key === "zip_code" ? "40000" : label}
                inputMode={f.key === "zip_code" ? "numeric" : undefined}
                onChange={(e) => onChange(f.key, f.key === "zip_code" ? e.target.value.replace(/\D/g, "") : e.target.value)}
                onBlur={() => onTouch(f.key)}
              />
            )}
            {err && (
              <p id={`${id}-err`} className="m-0 text-xs text-red-600">
                {err}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
