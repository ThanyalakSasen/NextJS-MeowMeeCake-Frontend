"use client";
// ─────────────────────────────────────────────────────────────
// /customer/shipping — การจัดส่งและส่งมอบสินค้า (BACKLOG3-merge D9 · ลิงก์จาก Footer) · ยกจาก FrontOffice src/app/customer/shipping/page.tsx
// ข้อมูลจาก API เดียวกับที่ checkout คิดจริง:
//   โซนค่าส่ง → /catalog/shipping-zones · จังหวัดร้าน → /catalog/store-info · หมวดส่งทั่วประเทศ → /catalog/categories (ships_nationwide)
//   จุดรับ → /catalog/pickup-locations (schedule สรุปมาจาก backend) · ส่วนไหนโหลดไม่ได้ ส่วนที่เหลือยังแสดง
// ต่างจากต้นแบบ: ตัดลิงก์ "บัญชีพร้อมเพย์สำหรับรับเงินคืน" (ยังไม่มีใน backend หลัก — U9 / Q-BE12)
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { catalogService } from "@/services/catalog";
import { pickupLocationsService } from "@/services/pickupLocations";
import { storeInfoService } from "@/services/storeInfo";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { baht, shopCard, shopPage } from "@/components/customer/shopStyles";
import { catalogCategoriesKey, shippingZonesKey, storeInfoKey } from "../lib/catalogQueries";
import { pickupLocationsKey } from "../lib/shopQueries";
import { nationwideCategoryNames } from "../lib/storeFormat";

/** ออเดอร์เว็บต้องชำระภายใน 30 นาที (backend ORDER_PAYMENT_WINDOW_MS) */
const PAYMENT_MINUTES = 30;

const STEPS = [
  { title: "s1", text: "d1" },
  { title: "s2", text: "d2" },
  { title: "s3", text: "d3" },
  { title: "s4", text: "d4" },
] as const;

export default function ShippingInfoPage() {
  const t = useTranslations("shop.shipping");
  const zonesQ = useQuery({ queryKey: shippingZonesKey, queryFn: storeInfoService.shippingZones, staleTime: 10 * 60_000 });
  const infoQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });
  const catsQ = useQuery({ queryKey: catalogCategoriesKey, queryFn: catalogService.categories });
  const pickupsQ = useQuery({ queryKey: pickupLocationsKey, queryFn: pickupLocationsService.list });

  const zones = zonesQ.data ?? [];
  const storeProvince = infoQ.data?.address.province.trim() ?? "";
  const nationwide = nationwideCategoryNames(catsQ.data ?? []);
  const pickups = pickupsQ.data ?? [];

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: t("crumb") }]} className="!mb-0" />
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t("title")}</h1>
          <p className="m-0 text-sm text-stone-500">{t("subtitle")}</p>
        </div>

        <section className={shopCard}>
          <h2 className="mb-5 text-lg font-bold">{t("afterOrder")}</h2>
          <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ title, text }, i) => (
              <li key={title} className="space-y-2 rounded-2xl border border-stone-100 bg-stone-50/70 p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4A342E] text-xs font-bold text-white">{i + 1}</span>
                <p className="m-0 text-sm font-bold">{t(`steps.${title}`)}</p>
                <p className="m-0 text-xs leading-relaxed text-stone-500">{t(`steps.${text}`, { n: PAYMENT_MINUTES })}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${shopCard} space-y-5`}>
          <h2 className="text-lg font-bold">{t("deliveryTitle")}</h2>
          {zonesQ.isLoading ? (
            <p className="m-0 text-sm text-stone-400">{t("loadingRates")}</p>
          ) : zones.length === 0 ? (
            <p className="m-0 text-sm text-stone-500">{t("ratesFailed")}</p>
          ) : (
            <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-100">
              {zones.map((z) => (
                <div key={z.zone_code} className="flex items-start justify-between gap-4 bg-white p-4">
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-bold">{z.zone_label}</p>
                    <p className="m-0 mt-1 text-xs leading-relaxed text-stone-500">
                      {z.provinces.length > 0 ? z.provinces.join(", ") : t("otherProvinces")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-[#8C5A3C]">{baht(z.fee)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ขอบเขตการจัดส่ง — ตรงกับ quoteStorefrontDelivery ของ backend (สินค้าที่ไม่ส่งทั่วประเทศ = เฉพาะจังหวัดร้าน) */}
          <div className="space-y-1 rounded-2xl border border-amber-200/70 bg-amber-50 p-4 text-xs leading-relaxed">
            <p className="m-0 font-bold text-amber-800">{t("scope")}</p>
            <p className="m-0 text-amber-900/80">
              {nationwide.length > 0
                ? t.rich("scopeNationwide", { cats: nationwide.join(", "), b: (c) => <span className="font-semibold">{c}</span> })
                : t("scopeFresh")}{" "}
              {t("scopeLocal", { area: storeProvince ? t("inProvince", { province: storeProvince }) : t("sameProvince") })}
            </p>
          </div>
        </section>

        <section className={`${shopCard} space-y-5`}>
          <h2 className="text-lg font-bold">{t("pickupTitle")}</h2>
          <p className="m-0 text-sm leading-relaxed text-stone-500">
            {t("pickupHint")}
          </p>
          {pickupsQ.isLoading ? (
            <p className="m-0 text-sm text-stone-400">{t("loadingPickup")}</p>
          ) : pickups.length === 0 ? (
            <p className="m-0 text-sm text-stone-500">{t("noPickup")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pickups.map((p) => (
                <div key={p._id} className="space-y-1.5 rounded-2xl border border-stone-100 bg-stone-50/70 p-4">
                  <p className="m-0 text-sm font-bold">{p.name}</p>
                  {p.location && p.location !== "-" && <p className="m-0 text-xs text-stone-500">{p.location}</p>}
                  {p.schedule && <p className="m-0 text-xs text-stone-500">{p.schedule}</p>}
                  {p.map_url && (
                    <a href={p.map_url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-[#8C5A3C] hover:underline">
                      {t("viewMap")}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={`${shopCard} space-y-3`}>
          <h2 className="text-lg font-bold">{t("notes")}</h2>
          <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-600">
            <li>{t("note1", { n: PAYMENT_MINUTES })}</li>
            <li>{t("note2")}</li>
            <li>{t("note3")}</li>
            <li>
              {t("moreQuestions")}{" "}
              <Link href="/customer/contact-us" className="font-semibold text-[#8C5A3C] hover:underline">
                {t("contact")}
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
