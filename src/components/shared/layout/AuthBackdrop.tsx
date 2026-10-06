"use client";
// ─────────────────────────────────────────────────────────────
// AuthBackdrop — พื้นหลังเต็มจอ + การ์ดของหน้า /login · /register (หน้าตาแบบ FrontOffice)
// มือถือ = ภาพร้าน + ไล่เงา + การ์ดโปร่งเบลอ (ตัวอักษรขาว) · จอใหญ่ (md) = การ์ดขาว (ตัวอักษรน้ำตาล)
// สไตล์ช่องกรอก/ป้ายที่เข้ากับพื้นหลังนี้: authInputClass · authLabelClass
// ─────────────────────────────────────────────────────────────
import Image from "next/image";
import { useTranslations } from "next-intl";

export const authInputClass =
  "w-full px-3.5 py-3 pr-11 rounded-xl text-sm outline-none transition bg-white/90 md:bg-white border-0 md:border-[1.5px] md:border-[#e1d6cd] text-[#1a1a1a] md:text-inherit focus:ring-4 focus:ring-[#f2ae00]/15 md:focus:border-[#f2ae00]";
export const authLabelClass =
  "text-[14.5px] font-semibold text-white md:text-[#4e342e] [text-shadow:0_1px_3px_rgba(0,0,0,0.3)] md:[text-shadow:none]";
/** ข้อความรอง (บนพื้นภาพ = ขาวจาง · การ์ดขาว = เทา) */
export const authMutedClass = "text-stone-200 md:text-stone-500";
/** ลิงก์บนพื้นภาพ = เหลือง · การ์ดขาว = น้ำตาล */
export const authLinkClass = "font-bold text-[#F2AE00] hover:underline md:text-[#4A342E]";

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
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/55 to-black/75 md:hidden" />
      </div>

      <div className="relative z-10 mx-auto my-6 w-full" style={{ maxWidth }}>
        <div className="rounded-3xl border border-white/25 bg-white/16 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:border-[#e6dace]/50 md:bg-white md:p-10 md:shadow-[0_12px_40px_rgba(74,52,46,0.05)] md:backdrop-blur-none">
          <div className="mb-6 text-center">
            <h1 className="m-0 text-2xl font-bold -tracking-[0.5px] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.3)] md:text-[26px] md:text-[#3e2723] md:[text-shadow:none]">
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
