"use client";
// ─────────────────────────────────────────────────────────────
// /customer/contact-us — ติดต่อร้าน (BACKLOG3-merge D8) · ยกจาก FrontOffice src/app/customer/contact-us/page.tsx
// ข้อมูลร้านทั้งหมดจาก GET /catalog/store-info (ตั้งค่าที่หลังร้าน "ข้อมูลร้าน" — E2) · ส่วนที่ร้านยังไม่ตั้ง = ไม่แสดง
// ฟอร์ม "ส่งข้อความหาเรา" เลิกใช้แล้ว → การ์ด "แชทกับร้าน" เปิดกล่องแชทลอย (ChatWidget · /shop/chat)
// ซ้าย: เบอร์ · อีเมล · โซเชียล · ขวา: แชทกับร้าน → ที่ตั้งร้าน (หน้าร้าน/จุดรับสินค้าไม่เกิน 2 แห่ง · ปุ่มเปิด Google Maps ของที่อยู่ร้าน)
// แผนที่ใช้ลิงก์เปิด Google Maps แทน iframe (iframe ตั้งคุกกี้ third-party ทันทีที่เปิดหน้า — ต้องขอความยินยอมตาม PDPA)
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { FaFacebook, FaGlobe, FaInstagram, FaLine } from "react-icons/fa";
import { storeInfoService, type SocialKey } from "@/services/storeInfo";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { shopButton, shopButtonPrimary, shopCard, shopPage } from "@/components/customer/shopStyles";
import { storeInfoKey } from "../lib/catalogQueries";
import { useChatWidgetStore } from "../store/chatWidgetStore";
import { formatStoreAddress, storeMapUrl } from "../lib/storeFormat";
import StorePickupList from "@/components/customer/StorePickupList";

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
  const infoQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });
  const info = infoQ.data;
  const storeName = info?.store_name || t("fallbackStoreName");
  const address = info ? formatStoreAddress(info.address) : "";
  const mapUrl = info ? storeMapUrl(info) : null;
  const socials = SOCIAL_BUTTONS.filter((s) => info?.social_links[s.key]?.trim());
  const nothingSet = !!info && !address && info.phones.length === 0 && info.weekly_markets.length === 0 && !info.contact_email;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: tf("contact") }]} className="!mb-0" />
        <h1 className="text-center text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section className={`${shopCard} space-y-6 lg:col-span-5`}>
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
              <div className="space-y-5">
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

          {/* คอลัมน์ขวา: แชทกับร้าน → ที่ตั้งร้าน (ใต้แชท) */}
          <div className="flex flex-col gap-8 lg:col-span-7">
            <section className={`${shopCard} space-y-6`}>
              <h2 className="flex items-center gap-2.5 text-xl font-bold sm:text-2xl">
                <MessageCircle size={24} className="text-[#8C5A3C]" />
                {t("chatTitle")}
              </h2>
              <ChatCard />
            </section>
            {/* ที่ตั้งร้าน = หน้าร้าน/จุดรับสินค้าไม่เกิน 2 แห่ง · ปุ่ม "เปิด Google Maps" ใต้ข้อมูลของแต่ละแห่ง (แห่งที่ไม่มีลิงก์แผนที่ = ไม่มีปุ่ม) */}
            {info && (address || info.weekly_markets.length > 0) && (
              <section className={shopCard}>
                <div className="flex min-w-0 items-start gap-3">
                  <MapPin size={22} className="mt-0.5 shrink-0 text-[#8C5A3C]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-lg font-bold">{t("location")}</h3>
                    <StorePickupList markets={info.weekly_markets} fallbackAddress={address} fallbackMapUrl={mapUrl} mapButtonClassName={shopButton} />
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** แชทกับร้าน — แทนฟอร์ม "ส่งข้อความหาเรา" เดิม (เปิดกล่องแชทลอยมุมขวาล่าง) */
function ChatCard() {
  const t = useTranslations("shop.contact");
  const setOpen = useChatWidgetStore((s) => s.setOpen);
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#8C5A3C]/20 bg-[#FAF6F0]/50 px-4 py-10 text-center">
      <MessageCircle size={40} className="text-[#8C5A3C]/60" aria-hidden="true" />
      <p className="m-0 max-w-sm text-sm text-gray-600">{t("chatHint")}</p>
      <button type="button" onClick={() => setOpen(true)} className={shopButtonPrimary}>
        <MessageCircle size={18} aria-hidden="true" />
        {t("chatOpen")}
      </button>
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
