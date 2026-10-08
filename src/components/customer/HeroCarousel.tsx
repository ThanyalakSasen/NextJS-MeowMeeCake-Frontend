"use client";
// ─────────────────────────────────────────────────────────────
// แบนเนอร์หน้าแรก (สไลด์ทุก 5 วินาที) — ย้ายมาจาก FrontOffice (components/customer/HeroCarousel.tsx)
// เปลี่ยนจากเดิม: ข้อมูลจาก GET /catalog/banners (backend หลัก) ผ่าน react-query · รูปผ่าน resolveUploadUrl
// backend ส่งเฉพาะ is_active มาแล้ว — ช่วงวันที่ (start/end) ยังกรองฝั่งนี้
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { catalogService } from "@/services/catalog";
import { resolveUploadUrl } from "@/lib/uploads";
import type { Banner } from "@/types/banner";

const DEFAULT_BANNER_IMAGE = "/banners/dfbanner.jpg";

function isBannerVisible(b: Banner, now: number = Date.now()): boolean {
  if (b.is_active !== true) return false;
  if (b.start_date && new Date(b.start_date).getTime() > now) return false;
  if (b.end_date && new Date(b.end_date).getTime() < now) return false;
  return true;
}

/** <img> onError — สลับไปรูปสำรอง (กัน loop ถ้ารูปสำรองก็พัง) */
function fallbackToDefault(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (el.src.endsWith(DEFAULT_BANNER_IMAGE)) return;
  el.src = DEFAULT_BANNER_IMAGE;
}

export default function HeroCarousel() {
  const t = useTranslations("shop");
  const bannersQ = useQuery({ queryKey: ["catalog", "banners"], queryFn: catalogService.banners, staleTime: 5 * 60_000 });
  const [bannerIndex, setBannerIndex] = useState(0);

  const banners = useMemo(
    () => (bannersQ.data ?? []).filter((b) => isBannerVisible(b)).sort((a, b) => a.sort_order - b.sort_order),
    [bannersQ.data],
  );

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => setBannerIndex((prev) => (prev + 1) % banners.length), 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const safeIndex = bannerIndex >= banners.length ? 0 : bannerIndex;
  const current = banners[safeIndex];
  const heroImage = resolveUploadUrl(current?.banner_img) ?? DEFAULT_BANNER_IMAGE;

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={bannersQ.isLoading || !current ? DEFAULT_BANNER_IMAGE : heroImage}
      alt={current?.banner_name || "MeowMee Cake"}
      className="w-full h-full object-cover"
      onError={fallbackToDefault}
    />
  );

  return (
    <header className="w-full h-[340px] sm:h-[400px] md:h-[600px] relative overflow-hidden bg-[#4A342E] flex flex-col justify-end">
      <div className="absolute inset-0 w-full h-full z-0">
        {current?.banner_link ? (
          <Link href={current.banner_link} className="block w-full h-full">
            {image}
          </Link>
        ) : (
          image
        )}
        {/* ไล่เฉดมืดให้อ่านข้อความง่ายขึ้น */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-14 pt-16 pointer-events-none">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 sm:mb-3 drop-shadow-lg">
          <span>MeowMee</span>
          <span className="hidden sm:inline-block w-8 sm:w-16 h-1 bg-white/60 rounded-xl my-auto" />
          <span className="italic font-serif">Cake</span>
        </h1>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm md:text-base text-gray-200 max-w-xl font-light leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-none">
            Freshly baked daily with premium ingredients, bringing the authentic taste of French pastries directly to your table
            with love and care.
          </p>

          {/* เป็น <Link> (= <a>) — antd ตั้ง a { background-color: transparent } นอก layer จึงต้องใส่ ! กับสีพื้น */}
          <Link
            href="/customer/product"
            className="pointer-events-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-5 py-2.5 sm:py-3 group self-start md:self-auto shrink-0 !bg-white border border-white/70 !text-[#4A342E] font-bold rounded-xl shadow-lg shadow-black/25 hover:!bg-[#4A342E] hover:border-[#4A342E] hover:!text-white hover:shadow-xl active:scale-[0.98] !transition-all duration-200"
          >
            <span>{t("common.allProducts")}</span>
            <span className="w-6 h-6 bg-[#4A342E]/10 group-hover:bg-white/20 rounded-full flex items-center justify-center text-[#4A342E] group-hover:text-white text-xs group-hover:translate-x-1 transition-all duration-200">
              →
            </span>
          </Link>
        </div>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl">
          {banners.map((b, index) => (
            <button
              key={b._id}
              type="button"
              className={`h-2 rounded-xl transition-all duration-300 ${
                index === safeIndex ? "w-6 bg-[#e2d7c7]" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              onClick={() => setBannerIndex(index)}
              aria-label={t("hero.banner", { n: index + 1 })}
            />
          ))}
        </div>
      )}
    </header>
  );
}
