"use client";
// ─────────────────────────────────────────────────────────────
// เลือกจุดรับสินค้า + วันรับ (takeaway) — แทน FrontOffice PickupLocationPicker
// วันที่ให้เลือก = order_pickup_dates ของแต่ละจุด — ออเดอร์ปกติ: จาก backend (ภายใน 14 วัน) · พรีออเดอร์: หน้า checkout
// พรีออเดอร์แทนค่าด้วยวันในช่วงรอบ (preorderPickupDates) — server ตรวจซ้ำตอนสร้างเสมอ
// วันรับเลือกจากปฏิทินรายเดือน (PickupDateCalendar) — ทั้งหน้า checkout ปกติและพรีออเดอร์
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import type { PickupLocation } from "@/services/pickupLocations";
import PickupDateCalendar, { pickupDateLabel } from "./PickupDateCalendar";

export { pickupDateLabel };

export default function PickupLocationPicker({
  locations,
  locationId,
  date,
  onChange,
}: {
  locations: PickupLocation[];
  locationId: string | null;
  date: string | null;
  onChange: (locationId: string, date: string | null) => void;
}) {
  const t = useTranslations("shop.pickup");
  const selected = locations.find((l) => l._id === locationId) ?? null;

  return (
    <div className="space-y-4">
      <div className="space-y-2" role="radiogroup" aria-label={t("locations")}>
        {locations.map((loc) => {
          const active = loc._id === locationId;
          const closed = loc.order_pickup_dates.length === 0;
          return (
            <button
              key={loc._id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={closed}
              // วันเดียว = เลือกให้เลย · เปลี่ยนจุด = ล้างวันเดิม (จุดใหม่อาจไม่เปิดวันนั้น)
              onClick={() => onChange(loc._id, loc.order_pickup_dates.length === 1 ? loc.order_pickup_dates[0] : null)}
              className={`w-full rounded-xl border-2 p-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? "border-[#8C5A3C] bg-[#FAF6F0]" : "border-gray-200 hover:border-[#8C5A3C]/40"
              }`}
            >
              <p className="font-bold">{loc.name}</p>
              {loc.location && <p className="text-gray-600">{loc.location}</p>}
              <p className="text-xs text-gray-500">{closed ? t("closed") : loc.schedule}</p>
            </button>
          );
        })}
      </div>

      {selected?.map_url && (
        <a href={selected.map_url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold text-[#8C5A3C] hover:text-[#4A342E]">
          {t("viewMap", { name: selected.name })}
        </a>
      )}

      {selected && (
        <div className="space-y-2 border-t border-[#8C5A3C]/10 pt-4">
          <p className="text-sm font-semibold">{t("date")}</p>
          {/* key = จุดรับ — เปลี่ยนจุดแล้วปฏิทินเริ่มที่เดือนแรกของจุดใหม่ */}
          <PickupDateCalendar key={selected._id} dates={selected.order_pickup_dates} value={date} onChange={(d) => onChange(selected._id, d)} />
        </div>
      )}
    </div>
  );
}
