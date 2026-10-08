"use client";
// ปุ่มสลับภาษา TH / EN บน Navbar หน้าร้าน (พื้นน้ำตาลเข้ม) — ตัวเดียวกับหลังร้าน: เขียน cookie mmc_locale แล้ว refresh (useSetLocale)
import { useTranslations } from "next-intl";
import { locales } from "@/i18n/config";
import { useSetLocale } from "@/i18n/useSetLocale";

export default function ShopLocaleSwitch() {
  const t = useTranslations("shop.nav");
  const { locale, setLocale, isPending } = useSetLocale();

  return (
    <div role="group" aria-label={t("language")} className={`inline-flex items-center rounded-lg border border-white/30 p-0.5 ${isPending ? "opacity-60" : ""}`}>
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          disabled={isPending}
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
          className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase transition ${
            locale === code ? "!bg-white !text-[#4A342E]" : "!text-white hover:!bg-white/15"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
