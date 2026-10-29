"use client";
// ─────────────────────────────────────────────────────────────
// ช่องเลือกจังหวัดของที่อยู่ลูกค้า — เลือกจาก 77 จังหวัดจริง (constants/thaiProvinces) แทนการพิมพ์เอง (2026-10-29)
// พิมพ์เพื่อกรองรายการได้ · ค่าเดิมที่ไม่อยู่ในรายการ (ที่อยู่เก่าที่พิมพ์เอง เช่น "กทม") ยังแสดงอยู่ แต่ผู้เรียกควรแจ้งให้เลือกใหม่
// (isThaiProvince) — ค่าส่งคิดจากชื่อจังหวัด ชื่อตรงรายการ = คิดค่าส่งถูกโซน
// ─────────────────────────────────────────────────────────────
import { Select } from "antd";
import { useTranslations } from "next-intl";
import { PROVINCE_OPTIONS, THAI_PROVINCES } from "@/constants/thaiProvinces";

export const isThaiProvince = (v: string) => (THAI_PROVINCES as readonly string[]).includes(v.trim());

export default function ProvinceSelect({
  value,
  onChange,
  id,
  status,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  status?: "error";
}) {
  const t = useTranslations("shop.address");
  return (
    <Select
      id={id}
      showSearch
      size="large"
      className="w-full"
      value={value || undefined}
      placeholder={t("provincePlaceholder")}
      options={PROVINCE_OPTIONS}
      status={status}
      notFoundContent={t("provinceNotFound")}
      filterOption={(input, opt) => String(opt?.label ?? "").replace(/\s+/g, "").includes(input.replace(/\s+/g, ""))}
      onChange={(v: string) => onChange(v)}
      aria-label={t("province")}
    />
  );
}
