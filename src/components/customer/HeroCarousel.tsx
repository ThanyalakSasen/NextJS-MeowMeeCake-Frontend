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
import ShopImage from "./ShopImage";
import { catalogBannersKey } from "@/app/customer/lib/catalogQueries";

const DEFAULT_BANNER_IMAGE = "/banners/dfbanner.jpg";

function isBannerVisible(b: Banner, now: number = Date.now()): boolean {
  if (b.is_active !== true) return false;
  if (b.start_date && new Date(b.start_date).getTime() > now) return false;
  if (b.end_date && new Date(b.end_date).getTime() < now) return false;
  return true;
}

export default function HeroCarousel() {
  const t = useTranslations("shop");
  // staleTime 30 วิ (เดิม 5 นาที) — แท็บที่เปิดค้างไว้ กลับมาโฟกัสแล้วดึงแบนเนอร์ใหม่ได้เร็ว (หลังร้านแก้แล้วเห็นไว)
  const bannersQ = useQuery({ queryKey: catalogBannersKey, queryFn: catalogService.banners, staleTime: 30_000 });
  const [bannerIndex, setBannerIndex] = useState(0);
  // รูปที่โหลดไม่ขึ้น → ใช้รูปสำรอง (next/image คุม src/srcset เอง สลับ el.src ตรง ๆ แบบเดิมไม่ได้)
  const [failed, setFailed] = useState<Set<string>>(() => new Set());

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
  const src = bannersQ.isPending || !current || failed.has(heroImage) ? DEFAULT_BANNER_IMAGE : heroImage;

  // ข้อความบนแบนเนอร์ = "ข้อความเพิ่มเติม" (banner_description) ของแบนเนอร์ที่กำลังแสดง
  // บรรทัดแรก = หัวข้อใหญ่ · บรรทัดที่เหลือ = ประโยคใต้หัวข้อ · ไม่มีข้อความ = แสดงแค่รูป + ปุ่ม
  const [title, ...restLines] = (current?.banner_description ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const subtitle = restLines.join("\n");

  // รูปใหญ่สุดเหนือขอบจอของหน้าแรก (LCP) → priority
  const image = (
    <ShopImage
      key={src}
      src={src}
      alt={current?.banner_name || "MeowMee Cake"}
      width={1920}
      height={1080}
      sizes="100vw"
      priority
      className="w-full h-full object-cover"
      onError={() => {
        if (src !== DEFAULT_BANNER_IMAGE) setFailed((prev) => new Set(prev).add(src));
      }}
    />
  );

  return (
    <header className="w-full h-[280px] sm:h-[340px] md:h-[460px] relative overflow-hidden bg-[#4A342E] flex flex-col justify-end">
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

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px] flex flex-col justify-end pb-12 sm:pb-14 pt-16 pointer-events-none">
        {/* h1 ของหน้าแรกเสมอ (Lighthouse heading-order) — แบนเนอร์ไม่มีข้อความ = ชื่อร้านแบบซ่อน (screen reader อ่านได้) */}
        {title ? (
          <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-extrabold text-white tracking-tight mb-2 sm:mb-3 drop-shadow-lg line-clamp-2">
            {title}
          </h1>
        ) : (
          <h1 className="sr-only">MeowMee Cake</h1>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          {subtitle ? (
            <p className="text-xs sm:text-sm xl:text-base text-gray-200 max-w-xl font-light leading-relaxed drop-shadow whitespace-pre-line line-clamp-2 sm:line-clamp-3">
              {subtitle}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}

          {/* เป็น <Link> (= <a>) — antd ตั้ง a { background-color: transparent } นอก layer จึงต้องใส่ ! กับสีพื้น */}
          <Link
            href="/customer/product"
            className="pointer-events-auto inline-flex items-center justify-center gap-2 text-sm h-[44px] px-5 group self-start md:self-auto shrink-0 !bg-white border border-white/70 !text-[#4A342E] font-bold rounded-xl shadow-lg shadow-black/25 hover:!bg-[#4A342E] hover:border-[#4A342E] hover:!text-white hover:shadow-xl active:scale-[0.98] !transition-all duration-200"
          >
            <span>{t("common.allProducts")}</span>
            <span className="w-6 h-6 bg-[#4A342E]/10 group-hover:bg-white/20 rounded-full flex items-center justify-center text-[#4A342E] group-hover:text-white text-xs group-hover:translate-x-1 transition-all duration-200">
              →
            </span>
          </Link>
        </div>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center bg-black/40 backdrop-blur-md px-1.5 rounded-xl">
          {/* ปุ่มกดได้ 24px (Lighthouse target-size) — จุดที่เห็นยังเล็กเท่าเดิม */}
          {banners.map((b, index) => (
            <button
              key={b._id}
              type="button"
              className="group flex h-6 min-w-6 cursor-pointer items-center justify-center border-none bg-transparent px-1"
              onClick={() => setBannerIndex(index)}
              aria-label={t("hero.banner", { n: index + 1 })}
              aria-current={index === safeIndex ? "true" : undefined}
            >
              <span
                className={`block h-2 rounded-xl transition-all duration-300 ${
                  index === safeIndex ? "w-6 bg-[#e2d7c7]" : "w-2 bg-white/50 group-hover:bg-white/80"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
