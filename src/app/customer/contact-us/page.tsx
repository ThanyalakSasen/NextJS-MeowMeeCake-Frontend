"use client";
// ─────────────────────────────────────────────────────────────
// /customer/contact-us — ติดต่อร้าน (BACKLOG3-merge D8) · ยกจาก FrontOffice src/app/customer/contact-us/page.tsx
// ข้อมูลร้านทั้งหมดจาก GET /catalog/store-info (ตั้งค่าที่หลังร้าน "ข้อมูลร้าน" — E2) · ส่วนที่ร้านยังไม่ตั้ง = ไม่แสดง
// ฟอร์ม "ส่งข้อความหาเรา" ต้อง login — POST /shop/contact { topic, message } (ชื่อ/เบอร์/อีเมล backend ดึงจากบัญชีเอง)
// ต่างจากต้นแบบ: หัวข้อ + ความยาวสูงสุดโหลดจาก /catalog/contact-topics (ต้นแบบเก็บสำเนาไว้ในหน้าเว็บ) · 429 = แจ้งให้รอ 1 นาที
// แผนที่ใช้ลิงก์เปิด Google Maps แทน iframe (iframe ตั้งคุกกี้ third-party ทันทีที่เปิดหน้า — ต้องขอความยินยอมตาม PDPA)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { FaFacebook, FaGlobe, FaInstagram, FaLine } from "react-icons/fa";
import { storeInfoService, type SocialKey } from "@/services/storeInfo";
import { isLinePlaceholderEmail, shopProfileService } from "@/services/shopProfile";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { LOGIN_PATH } from "@/constants/auth";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { shopButton, shopButtonPrimary, shopCard, shopInput, shopPage } from "@/components/customer/shopStyles";
import { contactTopicsKey, storeInfoKey } from "../lib/catalogQueries";
import { shopProfileKey } from "../lib/shopQueries";
import { formatMarketDays, formatStoreAddress, storeMapUrl } from "../lib/storeFormat";

const SOCIAL_BUTTONS: { key: SocialKey; label: string; icon: React.ReactNode; className: string }[] = [
  { key: "facebook", label: "Facebook", icon: <FaFacebook size={20} />, className: "bg-[#1877F2] hover:bg-[#166fe5]" },
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
  const socials = SOCIAL_BUTTONS.filter((s) => info?.social_links[s.key]?.trim());
  const nothingSet = !!info && !address && info.phones.length === 0 && info.weekly_markets.length === 0 && !info.contact_email;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: tf("contact") }]} className="!mb-0" />
        <h1 className="text-center text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section className={`${shopCard} space-y-6 lg:col-span-5`}>
            <h2 className="border-b border-[#8C5A3C]/15 pb-4 text-xl font-bold sm:text-2xl">
              {info?.store_name ? t("storeInfoNamed", { name: info.store_name }) : t("storeInfo")}
            </h2>

            {infoQ.isLoading ? (
              <p className="text-sm text-gray-500">{t("loading")}</p>
            ) : !info ? (
              <p className="text-sm text-red-600">{t("loadFailed")}</p>
            ) : (
              <div className="space-y-5">
                {address && (
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
                {info.weekly_markets.length > 0 && (
                  <InfoItem icon={<Clock size={22} />} title={t("markets")}>
                    <ul className="m-0 list-none space-y-2.5 p-0">
                      {info.weekly_markets.map((m, i) => (
                        <li key={`${m.name}-${i}`} className="text-sm leading-relaxed text-gray-600">
                          <span className="block font-semibold text-[#4A342E]">{m.name}</span>
                          {m.location && <span className="block">{m.location}</span>}
                          <span className="block">{t("hours", { days: formatMarketDays(m.days, ts), open: m.open_time, close: m.close_time })}</span>
                          {m.map_url && (
                            <a href={m.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-[#8C5A3C] hover:underline">
                              {t("viewMap")} <ExternalLink size={12} />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
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
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] ${s.className}`}
                  >
                    {s.icon}
                    <span>{s.key === "website" ? t("website") : s.label}: {storeName}</span>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className={`${shopCard} space-y-6 lg:col-span-7`}>
            <h2 className="flex items-center gap-2.5 text-xl font-bold sm:text-2xl">
              <MessageCircle size={24} className="text-[#8C5A3C]" />
              {t("sendMessage")}
            </h2>
            <ContactForm storeName={storeName} />
          </section>
        </div>

        {mapUrl && (
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

function ContactForm({ storeName }: { storeName: string }) {
  const t = useTranslations("shop.contact");
  const tc = useTranslations("shop.common");
  const { status } = useCustomerSession();
  const pathname = usePathname() ?? "/customer/contact-us";
  const authed = status === "authenticated";
  const topicsQ = useQuery({ queryKey: contactTopicsKey, queryFn: storeInfoService.contactTopics, staleTime: 10 * 60_000 });
  // ผู้ส่ง = บัญชีที่ login (แสดงให้รู้ว่าร้านจะติดต่อกลับทางไหน) · cache เดียวกับหน้าบัญชีของฉัน
  const profileQ = useQuery({ queryKey: shopProfileKey, queryFn: shopProfileService.get, enabled: authed });
  const profile = profileQ.data;
  const email = profile && !isLinePlaceholderEmail(profile.email) ? profile.email : "";

  const topics = topicsQ.data?.topics ?? [];
  const maxLength = topicsQ.data?.max_length ?? 1000;
  const [picked, setPicked] = useState<string | null>(null);
  const topic = picked ?? topics[0] ?? "";
  const [message, setMessage] = useState("");

  const send = useMutation({
    mutationFn: () => storeInfoService.sendContact({ topic, message: message.trim() }),
    onSuccess: () => {
      setMessage("");
      void alert.success(t("received", { store: storeName }), {
        title: profile?.user_fullname ? t("thanksNamed", { name: profile.user_fullname }) : t("thanks"),
      });
    },
    onError: (e) =>
      alert.error(
        isApiError(e) && e.status === 429
          ? t("rateLimited")
          : isApiError(e) ? e.message : t("sendFailed"),
      ),
  });

  if (status === "loading") return <p className="text-sm text-gray-500">{tc("loadingDots")}</p>;
  if (!authed) {
    return (
      <div className="space-y-3 rounded-2xl border border-dashed border-[#8C5A3C]/20 bg-[#FAF6F0]/50 py-10 text-center">
        <p className="m-0 text-sm text-gray-600">{t("loginFirst")}</p>
        <Link href={`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`} className={shopButtonPrimary}>{tc("login")}</Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (message.trim() && topic) send.mutate();
      }}
    >
      <div className="space-y-0.5 rounded-xl border border-[#8C5A3C]/15 bg-[#FAF6F0]/60 px-4 py-3 text-sm">
        <p className="m-0 text-gray-500">{t("sendAs")}</p>
        <p className="m-0 font-bold">{profile?.user_fullname || t("yourAccount")}</p>
        {profile && (
          <p className="m-0 text-gray-600">{[profile.user_phone, email].filter(Boolean).join(" · ") || t("noPhone")}</p>
        )}
        {profile && !profile.user_phone && (
          <Link href="/customer/account" className="inline-block text-xs font-semibold text-[#8C5A3C] hover:underline">
            {t("addPhone")}
          </Link>
        )}
      </div>

      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">{t("topic")}</span>
        <select value={topic} onChange={(e) => setPicked(e.target.value)} className={`${shopInput} cursor-pointer`} disabled={topics.length === 0}>
          {topics.map((tp) => (
            <option key={tp} value={tp}>{tp}</option>
          ))}
        </select>
        {topicsQ.isError && <span className="block text-xs text-red-600">{t("topicsFailed")}</span>}
      </label>

      <label className="block space-y-1.5">
        <span className="block text-sm font-bold">{t("message")}</span>
        <textarea
          rows={5}
          required
          maxLength={maxLength}
          placeholder={t("messagePlaceholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${shopInput} h-auto resize-none py-2.5`}
        />
        <span className="block text-right text-xs text-gray-500">{message.length}/{maxLength}</span>
      </label>

      <button type="submit" disabled={send.isPending || !message.trim() || !topic} className={`${shopButton} w-full`}>
        <Send size={18} />
        {send.isPending ? t("sending") : t("send")}
      </button>
    </form>
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
