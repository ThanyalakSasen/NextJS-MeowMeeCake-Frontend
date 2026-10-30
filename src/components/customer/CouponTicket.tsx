"use client";
// ─────────────────────────────────────────────────────────────
// คูปองแบบ "ตั๋ว" ของหน้าร้าน — ซ้าย = หัวตั๋ว (ส่วนลดตัวใหญ่) · เส้นประรอยฉีก · ขวา = ชื่อ/เงื่อนไข/วันหมดอายุ
//   CouponTicket      ตั๋วทั่วไป (แลกแต้ม · เลือกตอนชำระเงิน) — children = ปุ่ม/ข้อความท้ายตั๋ว · ribbon = ป้ายมุม (เช่น "คุ้มที่สุด")
//   CouponCodeTicket  ตั๋วที่มีรหัส + ปุ่มคัดลอก (คูปองของฉัน · แจ้งเตือนคูปอง)
//   CopyCodeButton    ปุ่มคัดลอกรหัสอย่างเดียว (ใช้ในรายการแจ้งเตือน)
// muted = ใช้ไม่ได้ (ใช้แล้ว/หมดอายุ/ไม่ถึงเงื่อนไข) — สีจางลง แต่ยังอ่านออก
// ขนาดกะทัดรัด (หัวตั๋วแคบลง · ตัวอักษร/ระยะเล็กลง) — เดิมใบใหญ่เกิน
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Ticket, Truck } from "lucide-react";
import type { DiscountType } from "@/services/shopLoyalty";

/** หัวตั๋ว: "10%" / "฿50" / ไอคอนส่งฟรี */
function Stub({ type, value, muted }: { type: DiscountType; value: number; muted?: boolean }) {
  const t = useTranslations("shop.coupons");
  return (
    <div
      className={`flex w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 px-1.5 py-2 text-center sm:w-20 ${
        muted ? "bg-stone-200 text-stone-600" : "bg-gradient-to-br from-[#4A342E] to-[#8C5A3C] text-white"
      }`}
    >
      {type === "FreeShipping" ? (
        <>
          <Truck className="h-5 w-5" aria-hidden="true" />
          <span className="text-[11px] font-bold leading-tight">{t("freeShipping")}</span>
        </>
      ) : (
        <>
          <span className="text-base font-black leading-none sm:text-lg">
            {type === "Percentage" ? `${value}%` : `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{t("off")}</span>
        </>
      )}
    </div>
  );
}

export function CouponTicket({
  type,
  value,
  title,
  lines = [],
  muted = false,
  selected = false,
  ribbon,
  badge,
  singleLineTitle = false,
  children,
}: {
  /** ชื่อคูปองบรรทัดเดียว (ไม่ตัดขึ้นบรรทัดใหม่ · จอแคบมาก = ตัดท้ายเป็น … และดูชื่อเต็มได้จาก tooltip) */
  singleLineTitle?: boolean;
  type: DiscountType;
  value: number;
  title: string;
  /** บรรทัดรายละเอียดใต้ชื่อ (เงื่อนไข · วันหมดอายุ) */
  lines?: (string | false | null | undefined)[];
  muted?: boolean;
  /** ถูกเลือกอยู่ (ตอนชำระเงิน) — ขอบเข้ม */
  selected?: boolean;
  /** ป้ายมุมขวาบน เช่น "คุ้มที่สุด" */
  ribbon?: string;
  /** ป้ายสถานะข้างชื่อ (พร้อมใช้/ใช้แล้ว/หมดอายุ) */
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex overflow-hidden rounded-xl border bg-white shadow-sm transition ${
        selected ? "border-[#8C5A3C] ring-2 ring-[#8C5A3C]/30" : muted ? "border-stone-200" : "border-[#8C5A3C]/20"
      } ${muted ? "opacity-80" : ""}`}
    >
      <Stub type={type} value={value} muted={muted} />
      {/* รอยฉีก: เส้นประ + ครึ่งวงกลมบน/ล่าง */}
      <div className="relative w-0 border-l-2 border-dashed border-stone-200" aria-hidden="true">
        <span className="absolute -left-[7px] -top-1.5 h-3 w-3 rounded-full border border-stone-200 bg-[#FAF6F0]" />
        <span className="absolute -bottom-1.5 -left-[7px] h-3 w-3 rounded-full border border-stone-200 bg-[#FAF6F0]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2">
        {/* เว้นขวาให้ป้ายมุม (ribbon) เฉพาะตอนมีป้าย — เดิมเว้นตลอด ชื่อคูปองเลยถูกบีบขึ้นบรรทัดใหม่ */}
        <div className={`flex items-start gap-2 ${ribbon ? "pr-14" : ""}`}>
          <Ticket className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${muted ? "text-stone-400" : "text-[#8C5A3C]"}`} aria-hidden="true" />
          <p
            className={`m-0 min-w-0 flex-1 text-[13px] font-bold leading-snug text-stone-800 ${singleLineTitle ? "truncate" : ""}`}
            title={singleLineTitle ? title : undefined}
          >
            {title}
          </p>
          {badge}
        </div>
        {lines.filter(Boolean).map((l, i) => (
          <p key={i} className="m-0 text-[11px] leading-snug text-stone-600">{l}</p>
        ))}
        {children && <div className="mt-0.5">{children}</div>}
      </div>
      {ribbon && (
        <span className="absolute right-0 top-0 rounded-bl-lg bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">{ribbon}</span>
      )}
    </div>
  );
}

/** คัดลอกรหัส — กดแล้วขึ้น "คัดลอกแล้ว" 2 วินาที · คลิปบอร์ดใช้ไม่ได้ (http / เบราว์เซอร์เก่า) = เลือกข้อความให้คัดลอกเอง */
export function CopyCodeButton({ code, className = "" }: { code: string; className?: string }) {
  const t = useTranslations("shop.coupons");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const h = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(h);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
        } catch {
          window.prompt(t("copyManual"), code);
        }
      }}
      aria-label={copied ? t("copied") : t("copyCode", { code })}
      className={`inline-flex h-[30px] shrink-0 items-center gap-1 rounded-md border px-2 text-[11px] font-bold transition ${
        copied ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-[#8C5A3C]/30 bg-white text-[#4A342E] hover:bg-[#4A342E] hover:text-white"
      } ${className}`}
    >
      {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
      {copied ? t("copied") : t("copy")}
    </button>
  );
}

/** ตั๋วที่มีรหัส + ปุ่มคัดลอก */
export function CouponCodeTicket({
  code,
  ...ticket
}: React.ComponentProps<typeof CouponTicket> & { code: string }) {
  const t = useTranslations("shop.coupons");
  return (
    <CouponTicket {...ticket}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-dashed border-[#8C5A3C]/40 bg-[#FAF6F0] px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-[#4A342E]" aria-label={t("codeLabel", { code })}>
          {code}
        </span>
        {!ticket.muted && <CopyCodeButton code={code} />}
      </div>
      {ticket.children}
    </CouponTicket>
  );
}
