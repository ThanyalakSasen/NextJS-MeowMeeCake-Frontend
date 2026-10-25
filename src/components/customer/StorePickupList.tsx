"use client";
// รายการหน้าร้าน / จุดรับสินค้า (ไม่เกิน MAX_SHOWN แห่ง) — ใช้ในส่วน "ที่อยู่ร้าน" ของหน้าติดต่อเรา และ Footer
// ข้อมูลจาก /catalog/store-info weekly_markets (เฉพาะที่ร้านเปิดแสดง · เรียงตามที่ตั้งไว้หลังร้าน — หน้าร้านหลักอยู่ก่อน)
// ร้านยังไม่ตั้งจุดรับเลย = แสดงที่อยู่ร้าน (fallbackAddress) แทน
// mapButtonClassName = แสดงปุ่ม "เปิด Google Maps" ใต้ข้อมูลของแต่ละแห่ง (หน้าติดต่อเรา) แทนลิงก์ "ดูแผนที่" เล็ก
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import type { WeeklyMarket } from "@/services/storeInfo";
import { formatMarketDays } from "@/app/customer/lib/storeFormat";

export const PICKUP_MAX_SHOWN = 2;

export default function StorePickupList({
  markets,
  fallbackAddress,
  nameClassName = "font-semibold text-[#4A342E]",
  textClassName = "text-sm leading-relaxed text-gray-600",
  linkClassName = "font-medium text-[#8C5A3C] hover:underline",
  showMap = true,
  mapButtonClassName,
  fallbackMapUrl,
}: {
  markets: WeeklyMarket[];
  fallbackAddress: string;
  nameClassName?: string;
  textClassName?: string;
  linkClassName?: string;
  /** ลิงก์ "ดูแผนที่" ของแต่ละแห่ง (Footer ไม่แสดง) */
  showMap?: boolean;
  /** มีค่า = ลิงก์แผนที่เป็นปุ่ม (class ของปุ่ม) */
  mapButtonClassName?: string;
  /** แผนที่ของที่อยู่ร้าน — ใช้กับ fallbackAddress (ยังไม่ตั้งจุดรับ) */
  fallbackMapUrl?: string | null;
}) {
  const t = useTranslations("shop.contact");
  const ts = useTranslations("shop.store");
  const shown = markets.slice(0, PICKUP_MAX_SHOWN);

  const mapLink = (href: string) =>
    mapButtonClassName ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-flex ${mapButtonClassName}`}>
        {t("openMaps")} <ExternalLink size={16} aria-hidden="true" />
      </a>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${linkClassName}`}>
        {t("viewMap")} <ExternalLink size={12} aria-hidden="true" />
      </a>
    );

  if (shown.length === 0) {
    if (!fallbackAddress) return null;
    return (
      <div className={textClassName}>
        <p className="m-0">{fallbackAddress}</p>
        {showMap && fallbackMapUrl && mapLink(fallbackMapUrl)}
      </div>
    );
  }

  return (
    <ul className={`m-0 list-none p-0 ${mapButtonClassName ? "space-y-5" : "space-y-3"}`}>
      {shown.map((m, i) => (
        <li key={`${m.name}-${i}`} className={textClassName}>
          <span className={`block ${nameClassName}`}>{m.name}</span>
          {m.location && <span className="block">{m.location}</span>}
          <span className="block">{t("hours", { days: formatMarketDays(m.days, ts), open: m.open_time, close: m.close_time })}</span>
          {showMap && m.map_url && mapLink(m.map_url)}
        </li>
      ))}
    </ul>
  );
}
