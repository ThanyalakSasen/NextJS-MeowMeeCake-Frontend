"use client";
// ─────────────────────────────────────────────────────────────
// /customer/contact-us — ติดต่อร้าน (BACKLOG3-merge D8) · ยกจาก FrontOffice src/app/customer/contact-us/page.tsx
// ข้อมูลร้านทั้งหมดจาก GET /catalog/store-info (ตั้งค่าที่หลังร้าน "ข้อมูลร้าน" — E2) · ส่วนที่ร้านยังไม่ตั้ง = ไม่แสดง
// ไม่มีฟอร์ม/แชท "ส่งข้อความหาเรา" ในหน้านี้แล้ว (2026-10-26) — ลูกค้าคุยกับร้านผ่านปุ่มแชทลอยมุมล่างขวา (ChatWidget)
//   ต้อง login · พิมพ์คุยโต้ตอบได้ + แนบคำสั่งซื้อ/พรีออเดอร์ของตัวเอง · ร้านตอบจากหลังร้าน /owner/chats
// แผนที่ใช้ลิงก์เปิด Google Maps แทน iframe (iframe ตั้งคุกกี้ third-party ทันทีที่เปิดหน้า — ต้องขอความยินยอมตาม PDPA)
// หน้าร้าน/จุดรับสินค้า: แสดงไม่เกิน 2 แห่ง (หน้าร้านหลักก่อน) แต่ละแห่งมีปุ่มเปิด Google Maps ของตัวเอง
//   ยังไม่ตั้งหน้าร้านเลย = การ์ดที่ตั้งร้านจากที่อยู่ร้านแบบเดิม
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebook, FaGlobe, FaInstagram, FaLine } from "react-icons/fa";
import { storeInfoService, type SocialKey } from "@/services/storeInfo";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { shopButton, shopCard, shopPage } from "@/components/customer/shopStyles";
import { storeInfoKey } from "../lib/catalogQueries";
import { formatMarketDays, formatStoreAddress, locationMapUrl, shownLocations, storeMapUrl } from "../lib/storeFormat";

const SOCIAL_BUTTONS: { key: SocialKey; label: string; icon: React.ReactNode; className: string }[] = [
  { key: "facebook", label: "Facebook", icon: <FaFacebook size={20} />, className: "bg-[#1464d2] hover:bg-[#1259bd]" },
  { key: "line", label: "LINE", icon: <FaLine size={20} />, className: "bg-[#06C755] hover:bg-[#05b34c]" },
  { key: "instagram", label: "Instagram", icon: <FaInstagram size={20} />, className: "bg-[#C13584] hover:bg-[#a92d73]" },
  // label ว่าง = ชื่อมาจาก i18n (shop.contact.website)
  { key: "website", label: "", icon: <FaGlobe size={18} />, className: "bg-[#4A342E] hover:bg-[#3A2924]" },
];

export default function ContactPage() {
  const t = useTranslations("shop.contact");
  const tf = useTranslations("shop.footer");
  const ts = useTranslations("shop.store");
  const infoQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });
  const info = infoQ.data;
  const storeName = info?.store_name || t("fallbackStoreName");
  const address = info ? formatStoreAddress(info.address) : "";
  const mapUrl = info ? storeMapUrl(info) : null;
  const locations = shownLocations(info);
  // หน้าร้านหลัก = ที่อยู่ร้าน (2026-10-26) — การ์ดหน้าร้านหลักใช้ที่อยู่ + แผนที่ของร้านเลย · ที่อยู่ด้านบนไม่ต้องแสดงซ้ำ
  const mainShown = !!address && locations.some((m) => m.is_main);
  const socials = SOCIAL_BUTTONS.filter((s) => info?.social_links[s.key]?.trim());
  const nothingSet = !!info && !address && info.phones.length === 0 && info.weekly_markets.length === 0 && !info.contact_email;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: tf("contact") }]} className="!mb-0" />
        <h1 className="text-center text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>

        <div>
          <section className={`${shopCard} space-y-6`}>
            <h2 className="border-b border-[#8C5A3C]/15 pb-4 text-xl font-bold sm:text-2xl">
              {info?.store_name ? t("storeInfoNamed", { name: info.store_name }) : t("storeInfo")}
            </h2>

            {/* isPending — ตอน render ฝั่ง server isLoading = false ทำให้ HTML แรกเป็น "โหลดไม่สำเร็จ" แล้วหน้ากระโดด (CLS) */}
            {infoQ.isPending ? (
              // โครงขนาดใกล้ของจริง (ที่อยู่ · โทร · ตลาด · อีเมล · ปุ่มโซเชียล) — เดิมข้อความบรรทัดเดียว
              // พอข้อมูลมา ฟอร์มข้างล่างถูกดันลง (Lighthouse CLS 0.19)
              <div className="min-h-[24rem] space-y-5" aria-busy="true" aria-label={t("loading")}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-stone-200/70" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-24 animate-pulse rounded bg-stone-200/70" />
                      <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !info ? (
              <p className="text-sm text-red-600">{t("loadFailed")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {address && !mainShown && (
                  <InfoItem icon={<MapPin size={22} />} title={t("address")}>
                    <p className="m-0 text-sm leading-relaxed text-gray-600">{address}</p>
                  </InfoItem>
                )}
                {info.phones.length > 0 && (
                  <InfoItem icon={<Phone size={22} />} title={t("phone")}>
                    {info.phones.map((phone) => (
                      <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="block text-sm font-medium text-[#8C5A3C] hover:underline">
                        {phone}
                      </a>
                    ))}
                  </InfoItem>
                )}
                {info.contact_email && (
                  <InfoItem icon={<Mail size={22} />} title={t("email")}>
                    <a href={`mailto:${info.contact_email}`} className="break-all text-sm font-medium text-[#8C5A3C] hover:underline">
                      {info.contact_email}
                    </a>
                  </InfoItem>
                )}
                {nothingSet && <p className="text-sm text-gray-500">{t("nothingSet")}</p>}
              </div>
            )}

            {socials.length > 0 && (
              <div className="space-y-3 border-t border-[#8C5A3C]/15 pt-5">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#8C5A3C]">{t("online")}</span>
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={info!.social_links[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex h-[44px] w-full items-center justify-center gap-3 rounded-2xl px-4 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] ${s.className}`}
                  >
                    {s.icon}
                    <span>{s.key === "website" ? t("website") : s.label}: {storeName}</span>
                  </a>
                ))}
              </div>
            )}
          </section>

        </div>

        {locations.length > 0 ? (
          <section className="space-y-3" aria-labelledby="store-locations">
            <h2 id="store-locations" className="m-0 flex items-center gap-2 text-xl font-bold sm:text-2xl">
              <Clock size={22} className="text-[#8C5A3C]" aria-hidden="true" /> {t("markets")}
            </h2>
            <div className={`grid grid-cols-1 gap-4 ${locations.length > 1 ? "md:grid-cols-2" : ""}`}>
              {locations.map((m, i) => (
                <article key={`${m.name}-${i}`} className={`${shopCard} flex flex-col gap-3`}>
                  <div className="flex items-start gap-3">
                    <MapPin size={22} className="mt-0.5 shrink-0 text-[#8C5A3C]" aria-hidden="true" />
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="m-0 flex flex-wrap items-center gap-2 text-lg font-bold">
                        {m.name}
                        {m.is_main && <span className="rounded-full bg-[#4A342E] px-2 py-0.5 text-xs font-semibold text-white">{t("mainStore")}</span>}
                      </h3>
                      {(m.is_main && address ? address : m.location) && (
                        <p className="m-0 break-words text-sm text-gray-600">{m.is_main && address ? address : m.location}</p>
                      )}
                      <p className="m-0 text-sm text-gray-700">{t("hours", { days: formatMarketDays(m.days, ts), open: m.open_time, close: m.close_time })}</p>
                    </div>
                  </div>
                  <a href={(m.is_main && mapUrl) || locationMapUrl(m)} target="_blank" rel="noopener noreferrer" className={`${shopButton} mt-auto w-full sm:w-auto sm:self-start`}>
                    {t("openMaps")} <ExternalLink size={16} aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
            {(info?.weekly_markets.length ?? 0) > locations.length && <p className="m-0 text-xs text-gray-500">{t("moreLocations")}</p>}
          </section>
        ) : mapUrl && (
          <section className={`${shopCard} flex flex-col justify-between gap-4 sm:flex-row sm:items-center`}>
            <div className="flex min-w-0 items-start gap-3">
              <MapPin size={22} className="mt-0.5 shrink-0 text-[#8C5A3C]" />
              <div className="min-w-0">
                <h3 className="text-lg font-bold">{t("location")}</h3>
                {address && <p className="m-0 mt-1 break-words text-sm text-gray-600">{address}</p>}
              </div>
            </div>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={`${shopButton} shrink-0`}>
              {t("openMaps")} <ExternalLink size={16} />
            </a>
          </section>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 rounded-2xl border border-[#8C5A3C]/10 bg-[#FAF6F0] p-3 text-[#8C5A3C]">{icon}</div>
      <div className="min-w-0 space-y-0.5">
        <strong className="block font-bold">{title}</strong>
        {children}
      </div>
    </div>
  );
}
