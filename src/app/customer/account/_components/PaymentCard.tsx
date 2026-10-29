"use client";
// ─────────────────────────────────────────────────────────────
// ชิ้นส่วนการ์ด "ชำระเงิน" — หน้าตาเดียวกันทั้งชำระบิลเดียว (SlipPaymentPanel) และชำระรวมหลายบิล (payment-group)
//   PayCard        กรอบการ์ด + หัวแถบครีม (ไอคอน QR · ชื่อ · คำอธิบาย · นาฬิกานับถอยหลัง)
//   PayQr          QR พร้อมเพย์ + ชื่อบัญชี + ยอด (ไม่มี QR = ข้อความให้โอนตามช่องทางร้าน)
//   SlipDropzone   กล่องแนบสลิปแบบกดทั้งกล่อง + ตัวอย่างรูป + ปุ่มส่ง
//   useSlipFile    เลือกไฟล์สลิป (ตรวจชนิด/ขนาด) + URL ตัวอย่าง
//   useSecondsLeft วินาทีที่เหลือก่อนหมดเขตชำระ (ชดเชยนาฬิกาเครื่องลูกค้าด้วย server_time)
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FaClock, FaQrcode, FaUpload } from "react-icons/fa";
import { alert } from "@/lib/alert";
import { compressImage, UPLOAD_SAFE_BYTES } from "@/lib/compressImage";
import { baht, shopButtonPrimary } from "@/components/customer/shopStyles";

export const SLIP_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const payCardClass = "overflow-hidden rounded-2xl border border-[#8C5A3C]/15 bg-white shadow-sm";
const cardHead = "flex items-center gap-3 border-b border-[#8C5A3C]/10 bg-[#FAF6F0]/80 px-4 py-3 sm:px-5";
const headIcon = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm text-[#8C5A3C] shadow-sm";

/** วินาทีที่เหลือก่อน dueAt — null = ไม่มีกำหนด · fetchedAt = เวลาเครื่องตอนได้ server_time มา */
export function useSecondsLeft(dueAt: string | null, serverTime: string, fetchedAt: number): number | null {
  const [now, setNow] = useState(() => Date.now());
  const due = dueAt ? new Date(dueAt).getTime() : null;
  const offset = fetchedAt ? new Date(serverTime).getTime() - fetchedAt : 0;
  useEffect(() => {
    if (due === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [due]);
  return due === null ? null : Math.max(0, Math.floor((due - (now + offset)) / 1000));
}

/** "29:59" · เกิน 1 ชม. (กำหนดยาว เช่นพรีออเดอร์) = "1 ชม. 59 นาที" · เกิน 2 วัน = "3 วัน 4 ชม." */
function timerText(sec: number, t: ReturnType<typeof useTranslations<"shop.slip">>): string {
  if (sec < 3600) return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h >= 48 ? t("daysHours", { d: Math.floor(h / 24), h: h % 24 }) : t("hoursMins", { h, m });
}

export function PayCard({
  title,
  sub,
  secondsLeft,
  className = "",
  children,
}: {
  title: string;
  sub: string;
  /** null = ไม่แสดงนาฬิกา */
  secondsLeft: number | null;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("shop.slip");
  return (
    <section className={`${payCardClass} ${className}`}>
      <div className={cardHead}>
        <span className={headIcon}>
          <FaQrcode aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 truncate text-base font-bold text-[#4A342E]">{title}</h2>
          <p className="m-0 truncate text-xs text-stone-500">{sub}</p>
        </div>
        {secondsLeft !== null && (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
              secondsLeft < 300 ? "bg-red-100 text-red-700" : "bg-white text-[#4A342E] ring-1 ring-[#8C5A3C]/15"
            }`}
            aria-label={`${t("payWithin")} ${timerText(secondsLeft, t)}`}
          >
            <FaClock className="text-xs" aria-hidden="true" />
            {timerText(secondsLeft, t)}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function PayQr({ qr, accountName, amount, scanText }: { qr: string | null; accountName: string | null | undefined; amount: number; scanText: string }) {
  const t = useTranslations("shop.slip");
  if (!qr) return <p className="m-0 rounded-xl bg-[#FAF6F0] p-3 text-sm text-stone-700">{t("transfer", { amount: baht(amount) })}</p>;
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-[240px] w-[240px] items-center justify-center rounded-2xl border border-[#8C5A3C]/15 bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt={t("qrAlt")} width={230} height={230} />
      </div>
      <p className="m-0 text-sm text-stone-600">{scanText}</p>
      {accountName && (
        <p className="m-0 text-sm">
          {t("accountName")} <span className="font-semibold">{accountName}</span>
        </p>
      )}
      <p className="m-0 text-3xl font-extrabold text-[#8C5A3C]">{baht(amount)}</p>
    </div>
  );
}

export function useSlipFile() {
  const t = useTranslations("shop.slip");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // ref = URL ตัวอย่างล่าสุด — ย่อรูปเป็น async ค่า preview ใน closure อาจเก่าแล้วตอนย่อเสร็จ
  const previewRef = useRef<string | null>(null);
  const apply = (f: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = f ? URL.createObjectURL(f) : null;
    setFile(f);
    setPreview(previewRef.current);
  };
  const pick = (f: File | null) => {
    if (f && !SLIP_TYPES.includes(f.type)) {
      alert.error(t("badType"));
      f = null;
    }
    if (!f) return apply(null);
    // ย่อก่อนส่ง — Vercel ตัด request เกิน 4.5 MB ด้วย 413 ก่อนถึง backend (ดู lib/compressImage.ts)
    void compressImage(f).then((small) => {
      if (small.size > UPLOAD_SAFE_BYTES) {
        alert.error(t("tooBig"));
        return apply(null);
      }
      apply(small);
    });
  };
  return { file, preview, pick };
}

export function SlipDropzone({
  label,
  preview,
  pending,
  disabled,
  onPick,
  onSend,
}: {
  label: string;
  preview: string | null;
  pending: boolean;
  /** ปิดปุ่มส่ง (ยังไม่เลือกไฟล์ · หมดเวลา) */
  disabled: boolean;
  onPick: (f: File | null) => void;
  onSend: () => void;
}) {
  const t = useTranslations("shop.slip");
  return (
    <div className="space-y-3 border-t border-[#8C5A3C]/10 pt-4">
      <p className="m-0 text-sm font-bold text-[#4A342E]">{label}</p>
      {/* กดทั้งกล่องเพื่อเลือกไฟล์ · มีไฟล์แล้วแสดงตัวอย่างแทน */}
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition ${
          preview ? "border-[#8C5A3C]/40 bg-white" : "border-[#8C5A3C]/25 bg-[#FAF6F0]/60 hover:border-[#8C5A3C]/50"
        } ${pending ? "pointer-events-none opacity-60" : ""}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={t("previewAlt")} className="max-h-64 rounded-xl object-contain" />
        ) : (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#8C5A3C] shadow-sm">
              <FaUpload aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-[#4A342E]">{t("pickSlip")}</span>
          </>
        )}
        <span className="text-xs text-stone-500">{preview ? t("changeSlip") : t("accepted")}</span>
        <input type="file" accept={SLIP_TYPES.join(",")} className="sr-only" onChange={(e) => onPick(e.target.files?.[0] ?? null)} disabled={pending} />
      </label>
      <button type="button" className={`${shopButtonPrimary} w-full`} disabled={disabled || pending} onClick={onSend}>
        {pending ? t("sending") : t("send")}
      </button>
    </div>
  );
}
