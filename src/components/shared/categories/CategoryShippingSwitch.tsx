"use client";
// ─────────────────────────────────────────────────────────────
// CategoryShippingSwitch — สวิตช์ "ส่งทั่วประเทศ / เฉพาะจังหวัดร้าน" ของหมวดสินค้า 1 หมวด
// ใช้ใน 2 ที่: แถวของ CategoryManagerDialog (หน้าจัดการข้อมูลสินค้า) · CategoryShippingButton (หน้าค่าจัดส่ง)
// presentational: ข้อมูล/สิทธิ์/การบันทึกมาจาก useCategoryShipping (สิทธิ์ store_info)
// ─────────────────────────────────────────────────────────────
import { Tooltip } from "antd";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/base";
import type { CategoryShipping } from "@/types/shippingZone";

export function CategoryShippingSwitch({
  item,
  checked = item.ships_nationwide,
  canUpdate,
  saving,
  onToggle,
  label,
}: {
  /** ข้อความข้างสวิตช์ — ไม่ส่ง = "ส่งทั่วประเทศ" / "เฉพาะจังหวัดร้าน" ตามสถานะ */
  label?: string;
  item: CategoryShipping;
  /** สถานะที่แสดง — ไม่ส่ง = ค่าของหมวด · หน้า "จัดส่งนอกจังหวัด" ส่ง "มีสินค้าเปิดอย่างน้อย 1 ชิ้น" */
  checked?: boolean;
  canUpdate: boolean;
  saving: boolean;
  onToggle: (id: string, value: boolean) => void;
}) {
  const t = useTranslations();
  return (
    <Tooltip title={item.ships_nationwide_auto ? t("shippingZones.categories.autoHint") : undefined}>
      <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600">
        <Switch
          size="small"
          checked={checked}
          disabled={!canUpdate}
          loading={saving}
          onChange={(v) => onToggle(item._id, v)}
          aria-label={t("shippingZones.categories.toggleLabel", { name: item.product_category_name })}
        />
        {label ?? (checked ? t("shippingZones.categories.nationwide") : t("shippingZones.categories.provinceOnly"))}
        {item.ships_nationwide_auto && <span className="text-gray-500">*</span>}
      </label>
    </Tooltip>
  );
}
