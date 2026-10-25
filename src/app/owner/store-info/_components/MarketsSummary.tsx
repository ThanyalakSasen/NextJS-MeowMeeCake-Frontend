"use client";
// โหมดดูของ "หน้าร้าน / จุดรับสินค้า" — รายการสรุปอ่านง่าย (แก้ไขในป๊อปอัปผ่าน WeeklyMarketsEditor)
// แต่ละแห่ง: ลำดับ · ชื่อ · ป้ายหน้าร้านหลัก · สถานะเปิดแสดง/ซ่อน · วัน-เวลา · สถานที่ · ลิงก์แผนที่
// หน้าร้านหลัก: สถานที่/แผนที่ = ที่อยู่ร้าน + พิกัด (เจ้าของร้านเห็นที่อยู่ · พนักงานเห็น location ที่ระบบเติม)
import { useTranslations } from "next-intl";
import { MapPinIcon } from "@heroicons/react/24/outline";
import type { AdminWeeklyMarket, StoreSettings } from "@/types/storeAdmin";
import { DAY_ORDER } from "../storeInfoForm";

export const formatAddress = (a: StoreSettings) =>
  [a.house_no, a.sub_district, a.district, a.province, a.zip_code].map((s) => s.trim()).filter(Boolean).join(" ");

export const coordsMapUrl = (a: StoreSettings) =>
  a.latitude != null && a.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}` : "";

function MapLink({ href }: { href: string }) {
  const t = useTranslations();
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brown-700 hover:underline">
      <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {t("storeInfo.openMap")}
    </a>
  );
}

export function MarketsSummary({ markets, address }: { markets: AdminWeeklyMarket[]; /** เจ้าของร้านเท่านั้น */ address?: StoreSettings }) {
  const t = useTranslations();
  const ordered = [...markets].sort((a, b) => Number(!!b.is_main) - Number(!!a.is_main));
  const hasMain = markets.some((m) => m.is_main);
  const noneActive = !markets.some((m) => m.is_active);
  const addressText = address ? formatAddress(address) : "";
  const addressMap = address ? coordsMapUrl(address) : "";

  const daysText = (m: AdminWeeklyMarket) =>
    m.days.length === 7 ? t("storeInfo.markets.everyday") : DAY_ORDER.filter((d) => m.days.includes(d)).map((d) => t(`storeInfo.days.${d}`)).join(" · ");

  return (
    <div className="flex flex-col gap-2">
      {noneActive && (
        <p className="m-0 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {markets.length === 0 ? t("storeInfo.markets.empty") : t("storeInfo.markets.noneActive")} {t("storeInfo.markets.editHint")}
        </p>
      )}

      {/* ยังไม่ได้เปิดรับที่หน้าร้านหลัก — แสดงที่อยู่ร้านไว้บนสุด + บอกว่ายังเลือกรับที่นี่ไม่ได้ */}
      {!hasMain && address && (
        <div className="flex gap-3 rounded-lg border border-dashed border-brown-200 p-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">1</span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="m-0 text-sm font-semibold text-brown-800">{t("storeInfo.markets.mainBadge")}</p>
            <p className={`m-0 text-sm ${addressText ? "text-gray-700" : "text-amber-700"}`}>{addressText || t("storeInfo.notSetShort")}</p>
            {addressMap && <MapLink href={addressMap} />}
            <p className="m-0 text-xs text-amber-700">{t("storeInfo.markets.mainNotOpen")}</p>
          </div>
        </div>
      )}

      {ordered.map((m, pos) => {
        const n = pos + 1 + (!hasMain && address ? 1 : 0);
        const place = m.is_main ? addressText || m.location : m.location;
        const map = m.is_main ? addressMap || m.map_url : m.map_url;
        return (
          <div key={m._id ?? `${m.name}-${pos}`} className={`flex gap-3 rounded-lg border p-3 ${m.is_active ? "border-gray-100" : "border-dashed border-gray-200 opacity-75"}`}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brown-800 text-xs font-bold text-white">{n}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-brown-800">{m.name || t("storeInfo.notSetShort")}</span>
                {m.is_main && <span className="rounded-full bg-brown-50 px-2 py-0.5 text-xs font-semibold text-brown-800">{t("storeInfo.markets.mainBadgeShort")}</span>}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {m.is_active ? t("storeInfo.markets.activeShort") : t("storeInfo.markets.hiddenShort")}
                </span>
              </div>
              <p className="m-0 text-sm text-gray-700">
                {t("storeInfo.markets.daysTime", { days: daysText(m) || "—", open: m.open_time, close: m.close_time })}
              </p>
              {place && <p className="m-0 text-xs text-gray-500">{place}</p>}
              {map && <MapLink href={map} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
