"use client";
// ─────────────────────────────────────────────────────────────
// /customer/forgot-password — ขอลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล (ลิงก์ "ลืมรหัสผ่าน?" ในหน้า /login)
// ยกจาก FrontOffice src/app/customer/forgot-password/page.tsx (โหมด guest) · API POST /auth/forgot-password
// ล็อกอินอยู่ = เติมอีเมลบัญชีให้ (โหมด "เปลี่ยนรหัสผ่าน" + เมนูบัญชีของ FrontOffice → รวมกับ BACKLOG3-merge B2)
// backend ตอบเหมือนกันไม่ว่าอีเมลจะมีในระบบไหม (กันเดาอีเมล) · บัญชี Google/LINE ที่ไม่มีรหัสผ่าน = 400 พร้อมข้อความ
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/authClient";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { LOGIN_PATH } from "@/constants/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const card =
  "mx-auto flex w-full max-w-[580px] flex-col items-center rounded-2xl border border-stone-100 bg-white p-8 text-center shadow-sm sm:p-10";
const button =
  "flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-[#8C5A3C]/30 bg-white px-6 py-3.5 text-sm font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300";

export default function ForgotPasswordPage() {
  const t = useTranslations("shop.password");
  const { user } = useCustomerSession();
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const email = (emailInput ?? user?.email ?? "").trim();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!EMAIL_RE.test(email)) {
      alert.warning(t("invalidEmail"));
      return;
    }
    setSending(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("sendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#f5f5f5] pb-16 pt-32 text-stone-800 sm:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-xl font-bold text-stone-900 sm:text-2xl">{t("forgotTitle")}</h1>
        <div className={card}>
          {sent ? (
            <>
              <Mail className="mb-4 h-12 w-12 text-[#8C5A3C]" />
              <h2 className="mb-3 text-lg font-bold text-stone-900">{t("sentTitle")}</h2>
              <p className="mb-2 text-sm leading-relaxed text-stone-500">
                {t.rich("sentBody", { email, b: (c) => <strong className="font-semibold text-stone-800">{c}</strong>, br: () => <br /> })}
              </p>
              <p className="mt-3 text-xs text-stone-400">{t("spamHint")}</p>
              <Link href={LOGIN_PATH} className="mt-6 text-sm font-semibold text-[#4A342E] hover:underline">
                {t("backToLogin")}
              </Link>
            </>
          ) : (
            <>
              <h2 className="mb-3 text-lg font-bold text-stone-900">{t("verifyIdentity")}</h2>
              <p className="mb-4 text-sm leading-relaxed text-stone-500">
                {t("enterEmailHint")}
              </p>
              <input
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                aria-label={t("email")}
                value={emailInput ?? user?.email ?? ""}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
                className="mb-6 w-full max-w-xs rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-800 focus:border-[#4A342E] focus:outline-none focus:ring-2 focus:ring-[#4A342E]/30"
              />
              <button type="button" className={button} onClick={() => void send()} disabled={sending}>
                {sending ? t("sending") : t("sendLink")}
              </button>
              <p className="mt-4 text-xs text-stone-400">
                {t("socialNoPassword")}
              </p>
              <Link href={LOGIN_PATH} className="mt-4 text-sm font-semibold text-[#4A342E] hover:underline">
                {t("backToLogin")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
