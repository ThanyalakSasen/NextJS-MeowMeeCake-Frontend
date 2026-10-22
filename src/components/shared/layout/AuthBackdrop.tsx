"use client";
// ─────────────────────────────────────────────────────────────
// AuthBackdrop — พื้นหลังเต็มจอ + การ์ดของหน้า /login · /register (หน้าตาแบบ FrontOffice)
// มือถือ = ภาพร้าน + ไล่เงาขาว (ภาพสว่าง) + การ์ดโปร่งเบลอ (ตัวอักษรดำ) · จอใหญ่ (md) = การ์ดขาวทึบ (ตัวอักษรน้ำตาล)
// สไตล์ช่องกรอก/ป้ายที่เข้ากับพื้นหลังนี้: authInputClass · authLabelClass
// ─────────────────────────────────────────────────────────────
import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * ช่องกรอกของหน้า /login · /register — ความสูงตามจอ:
 *   มือถือ (<640) 36px = เท่ากรอบปุ่ม "ไม่มี/มีประวัติแพ้อาหาร" · 640–1279 44px · ≥1280 ขนาดเดิม (py-3 ≈ 52px)
 *   มุม rounded-lg (9px · เดิม rounded-xl 13.5px)
 */
export const authInputClass =
  "w-full h-[36px] sm:h-[44px] xl:h-auto py-0 xl:py-3 px-3.5 pr-11 rounded-lg text-sm outline-none transition bg-white border-[1.5px] border-[#e1d6cd] text-[#1a1a1a] md:text-inherit focus:ring-4 focus:ring-[#f2ae00]/15 focus:border-[#f2ae00]";
export const authLabelClass = "text-[14.5px] font-semibold text-[#1a1a1a] md:text-[#4e342e]";
/** ข้อความรอง — เทา (บนการ์ดขาวทั้งสองขนาดจอ) */
export const authMutedClass = "text-stone-600 md:text-stone-500";
/** ลิงก์ — น้ำตาล (เหลืองเดิมอ่านไม่ออกบนการ์ดขาว) */
export const authLinkClass = "font-bold text-[#8C5A3C] hover:underline md:text-[#4A342E]";

export function AuthBackdrop({
  title,
  subtitle,
  maxWidth = 480,
  children,
}: {
  title: string;
  subtitle?: string;
  maxWidth?: number;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#fcf9f6] p-4 md:bg-[radial-gradient(circle_at_15%_20%,#fff5ee_0%,#fcf9f6_100%)] md:p-5">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/login.png"
          alt={t("auth.loginBackground")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center md:object-[20%_center]"
        />
        {/* มือถือ: ไล่เงาขาวทับภาพให้สว่าง — ตัวอักษรดำบนการ์ดโปร่งอ่านได้ (ส่วนที่มืดสุดของภาพยังได้คอนทราสต์ > 4.5:1) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/65 to-white/80 md:hidden" />
      </div>

      <div className="relative z-10 mx-auto my-6 w-full" style={{ maxWidth }}>
        <div className="rounded-3xl border border-white/25 bg-white/16 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:border-[#e6dace]/50 md:bg-white md:p-10 md:shadow-[0_12px_40px_rgba(74,52,46,0.05)] md:backdrop-blur-none">
          <div className="mb-6 text-center">
            <h1 className="m-0 text-2xl font-bold -tracking-[0.5px] text-[#1a1a1a] md:text-[26px] md:text-[#3e2723]">
              {title}
            </h1>
            {subtitle && <p className={`m-0 mt-1 text-sm ${authMutedClass}`}>{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
