"use client";
// Footer ของหน้าร้าน — ย้ายมาจาก FrontOffice (components/customer/Footer.tsx)
// Facebook + ที่อยู่ร้านจาก /catalog/store-info (BACKLOG4 U5 · ตั้งค่าที่หลังร้าน "ข้อมูลร้าน" — E2)
// ร้านยังไม่ตั้ง/โหลดไม่ได้ = ค่าเดิมของต้นแบบ · ลิงก์ "การจัดส่ง" (D9) · "ติดต่อเรา" (D8)
// หน้าร้าน/จุดรับสินค้า: ไม่เกิน 2 แห่ง (หน้าร้านหลักก่อน) + ปุ่ม Google Maps ของแต่ละแห่ง · ยังไม่ตั้ง = ที่อยู่ร้าน
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FaFacebook } from "react-icons/fa";
import { MapPin } from "lucide-react";
import { storeInfoService } from "@/services/storeInfo";
import { storeInfoKey } from "@/app/customer/lib/catalogQueries";
import { formatMarketDays, formatStoreAddress, locationMapUrl, shownLocations } from "@/app/customer/lib/storeFormat";

const FALLBACK_FACEBOOK =
  "https://www.facebook.com/people/%E0%B9%80%E0%B8%AB%E0%B8%A1%E0%B8%B5%E0%B8%A2%E0%B8%A2%E0%B8%A1%E0%B8%B5%E0%B9%80%E0%B8%84%E0%B9%89%E0%B8%81/61554367860480/?locale=th_TH";

const linkClass = "text-gray-700 hover:text-gray-900 hover:underline transition-colors";

export default function Footer() {
  const t = useTranslations("shop.footer");
  const tc = useTranslations("shop.contact");
  const ts = useTranslations("shop.store");
  const { data: info } = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });
  const facebook = info?.social_links.facebook.trim() || FALLBACK_FACEBOOK;
  const address = (info && formatStoreAddress(info.address)) || t("fallbackAddress");
  const storeName = info?.store_name.trim() || t("fallbackStoreName");
  const locations = shownLocations(info);

  return (
    <footer className="w-full bg-gray-100 text-gray-900 border-t border-gray-200">
      <div className="max-w-[1200px] mx-auto px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px] py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold text-gray-900">{t("social")}</h3>
            <a
              className="inline-flex items-center gap-3 text-gray-800 hover:text-blue-600 transition-colors w-fit"
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook className="text-2xl text-blue-600 flex-shrink-0" />
              <span className="text-base font-medium">{storeName}</span>
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-lg font-bold text-gray-900">{locations.length ? t("locations") : t("address")}</h4>
            {locations.length === 0 ? (
              <p className="text-gray-700 leading-relaxed">{address}</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {locations.map((m, i) => (
                  <li key={`${m.name}-${i}`} className="text-sm leading-relaxed text-gray-700">
                    <span className="block font-semibold text-gray-900">{m.name}</span>
                    <span className="block">{tc("hours", { days: formatMarketDays(m.days, ts), open: m.open_time, close: m.close_time })}</span>
                    <a
                      href={locationMapUrl(m)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 transition hover:bg-gray-800 hover:text-white"
                    >
                      <MapPin size={14} aria-hidden="true" />
                      {t("openMaps")}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-lg font-bold text-gray-900">{t("menu")}</h4>
            <div className="flex flex-col gap-2">
              <Link href="/customer/product" className={linkClass}>{t("allProducts")}</Link>
              <Link href="/customer/shipping" className={linkClass}>{t("shipping")}</Link>
              <Link href="/customer/contact-us" className={linkClass}>{t("contact")}</Link>
            </div>
          </div>
        </div>

        <div className="text-center py-6 my-8">
          <h2 className="text-4xl sm:text-6xl tracking-wider text-gray-800 drop-shadow-sm italic">Meowmee Cake</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-sm text-gray-600">
          <p>© 2026 Meowmee Cake. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
