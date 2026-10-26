"use client";
// ─────────────────────────────────────────────────────────────
// โหมดดูของหน้า "ข้อมูลร้าน" — รายการอ่านง่าย (ป้ายชื่อ : ค่า) แทนช่องกรอกที่ถูกปิดไว้
// เดิมโหมดดูเป็นฟอร์ม disabled ทั้งหน้า: ตัวจาง แยกค่าจริงกับตัวอย่างไม่ออก และดูเหมือนแก้ได้ · ค่าที่ยังไม่ตั้ง = "ยังไม่ได้ตั้งค่า" สีเทา
// กด "แก้ไข" ที่หัวการ์ด → กลับเป็นฟอร์มของหัวข้อนั้น (StoreInfoView)
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { MapPinIcon } from "@heroicons/react/24/outline";
import type { AdminWeeklyMarket, StoreSettings } from "@/types/storeAdmin";
import { DAY_ORDER, SOCIAL_KEYS, type ProfileForm } from "../storeInfoForm";
import type { StaffOption } from "../useStoreInfoViewModel";
import { formatStoreAddress } from "@/app/customer/lib/storeFormat";

/** 1 แถว: ป้ายซ้าย · ค่าขวา (จอแคบซ้อนกัน) */
export function ReadRow({ label, children }: { label: string; children?: React.ReactNode }) {
  const t = useTranslations("storeInfo");
  const empty = children == null || children === "" || children === false;
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-gray-100 py-2 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`m-0 min-w-0 break-words text-sm ${empty ? "text-gray-500" : "font-medium text-gray-900"}`}>
        {empty ? t("notSet") : children}
      </dd>
    </div>
  );
}

const link = (url: string) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="text-brown-700 underline-offset-2 hover:underline">
    {url}
  </a>
);

export function GeneralRead({ profile }: { profile: ProfileForm }) {
  const t = useTranslations();
  return (
    <dl className="m-0">
      <ReadRow label={t("storeInfo.general.storeName")}>{profile.store_name}</ReadRow>
    </dl>
  );
}

export function ContactRead({ profile, staff, systemEmail }: { profile: ProfileForm; staff: StaffOption[]; systemEmail: string }) {
  const t = useTranslations();
  const person = (id: string) => {
    if (!id) return null;
    const s = staff.find((o) => o.value === id);
    if (!s) return null;
    return (
      <>
        {s.phone || t("storeInfo.contact.noPhone")}
        <span className="ml-1.5 text-xs font-normal text-gray-500">{s.label}</span>
      </>
    );
  };
  return (
    <dl className="m-0">
      <ReadRow label={t("storeInfo.contact.phonePrimary")}>{person(profile.phone_primary_user_id)}</ReadRow>
      <ReadRow label={t("storeInfo.contact.phoneSecondary")}>{person(profile.phone_secondary_user_id)}</ReadRow>
      <ReadRow label={t("storeInfo.contact.email")}>{profile.contact_email}</ReadRow>
      <ReadRow label={t("storeInfo.contact.systemEmail")}>{systemEmail}</ReadRow>
      {SOCIAL_KEYS.map((k) => (
        <ReadRow key={k} label={t(`storeInfo.contact.social.${k}`)}>
          {profile.social_links[k] ? link(profile.social_links[k]) : null}
        </ReadRow>
      ))}
    </dl>
  );
}

export function PromptpayRead({ profile }: { profile: ProfileForm }) {
  const t = useTranslations();
  return (
    <dl className="m-0">
      <ReadRow label={t("storeInfo.promptpay.id")}>{profile.promptpay_id}</ReadRow>
      <ReadRow label={t("storeInfo.promptpay.accountName")}>{profile.promptpay_account_name}</ReadRow>
    </dl>
  );
}

/**
 * หน้าร้านประจำสัปดาห์ — การ์ดเล็กต่อแห่ง: ชื่อ (+ หน้าร้านหลัก / ซ่อนอยู่) · วัน · เวลา · สถานที่ · แผนที่
 * address (เจ้าของร้าน) = ที่อยู่ร้านกับหน้าร้านหลักเป็นข้อมูลชุดเดียวกัน (2026-10-26) — หน้าร้านหลักแสดงที่อยู่ร้าน + หมุดแผนที่ของร้าน
 */
export function MarketsRead({ markets, address }: { markets: AdminWeeklyMarket[]; address?: StoreSettings }) {
  const t = useTranslations();
  const storeAddress = address ? formatStoreAddress(address) : "";
  const storePin = address?.latitude != null && address.longitude != null
    ? `https://www.google.com/maps?q=${address.latitude},${address.longitude}`
    : "";
  if (markets.length === 0) return <p className="m-0 text-sm text-amber-700">{t("storeInfo.markets.empty")}</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {markets.map((m, i) => (
        <li key={m._id ?? i} className={`rounded-lg border px-3 py-2.5 ${m.is_active ? "border-gray-200" : "border-dashed border-gray-200 bg-gray-50"}`}>
          <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-semibold text-brown-900">
            {m.name}
            {m.is_main && <span className="rounded-full bg-brown-800 px-2 py-0.5 text-xs font-semibold text-white">{t("storeInfo.markets.main")}</span>}
            {!m.is_active && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">{t("storeInfo.markets.hiddenBadge")}</span>}
          </p>
          <p className="m-0 mt-0.5 text-sm text-gray-800">
            {DAY_ORDER.filter((d) => m.days.includes(d)).map((d) => t(`storeInfo.days.${d}`)).join(" · ")}
            <span className="text-gray-500"> · </span>
            {t("storeInfo.read.hours", { open: m.open_time, close: m.close_time })}
          </p>
          {(() => {
            const location = m.is_main && address ? storeAddress : m.location;
            const mapUrl = m.is_main && address ? storePin || m.map_url : m.map_url;
            return (
              <>
                {m.is_main && address && !storeAddress ? (
                  <p className="m-0 text-xs text-amber-700">{t("storeInfo.markets.mainNoAddress")}</p>
                ) : (
                  location && (
                    <p className={`m-0 ${m.is_main && address ? "mt-1 text-sm text-gray-800" : "text-xs text-gray-600"}`}>
                      {m.is_main && address && <span className="mr-1 text-gray-500">{t("storeInfo.address.title")}:</span>}
                      {location}
                    </p>
                  )
                )}
                {mapUrl && (
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-brown-700 hover:underline">
              <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t("storeInfo.read.openMap")}
                  </a>
                )}
              </>
            );
          })()}
        </li>
      ))}
    </ul>
  );
}
