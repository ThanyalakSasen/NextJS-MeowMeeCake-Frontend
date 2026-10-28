"use client";
// ─────────────────────────────────────────────────────────────
// /customer/forgot-password — ลืมรหัสผ่าน
//   "ลืมรหัสผ่าน?" ในหน้า /login ไม่มาที่นี่ — เลือกบัญชี Google + แจ้งเตือนในหน้า login เอง (forgotPasswordFlow.ts)
//   ที่มา: "ใช้อีเมลอื่น" ในหน้า /login (อีเมลที่ไม่ใช่บัญชี Google) · "ลืมรหัสผ่านปัจจุบัน?" ในหน้าเปลี่ยนรหัสผ่าน (เติมอีเมลบัญชีให้) · ลิงก์หมดอายุ → "ขอลิงก์ใหม่" ·
//   ไม่ได้ตั้ง NEXT_PUBLIC_GOOGLE_CLIENT_ID → ฟอร์มกรอกอีเมล (+ ปุ่มเลือกบัญชี Google แทน) → "ส่งลิงก์เรียบร้อยแล้ว"
// ลิงก์ในอีเมลพาไป /customer/reset-password → ตั้งรหัสเสร็จกลับหน้า /login
// backend ตอบเหมือนกันไม่ว่าอีเมลจะมีในระบบไหม (กันเดาอีเมล) · บัญชี Google/LINE ที่ไม่มีรหัสผ่าน = 400 พร้อมข้อความ
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/authClient";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { LOGIN_PATH } from "@/constants/auth";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { GOOGLE_CLIENT_ID, preloadGoogleAccountPicker } from "@/app/login/_components/googleAccountPicker";
import { resetPasswordWithGoogle } from "@/app/login/_components/forgotPasswordFlow";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const card =
  "mx-auto flex w-full max-w-[580px] flex-col items-center rounded-2xl border border-stone-100 bg-white p-8 text-center shadow-sm sm:p-10";
const button =
  "flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-[#8C5A3C]/30 bg-white h-[44px] px-6 text-sm font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300";
const textLink = "text-sm font-semibold text-[#4A342E] hover:underline";

export default function ForgotPasswordPage() {
  const t = useTranslations("shop.password");
  const { user } = useCustomerSession();
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const email = (emailInput ?? user?.email ?? "").trim();
  const [sending, setSending] = useState(false);
  /** อีเมลที่ส่งลิงก์ไปแล้ว + มาจากบัญชี Google ไหม (แสดงปุ่มเปิด Gmail) */
  const [sent, setSent] = useState<{ email: string; google: boolean } | null>(null);

  // ปุ่ม "เลือกบัญชี Google แทน" เปิดหน้าต่างได้เร็ว
  useEffect(() => {
    if (GOOGLE_CLIENT_ID) preloadGoogleAccountPicker();
  }, []);

  async function sendTyped() {
    if (!EMAIL_RE.test(email)) {
      alert.warning(t("invalidEmail"));
      return;
    }
    setSending(true);
    try {
      await requestPasswordReset(email);
      setSent({ email, google: false });
    } catch (e) {
      // 400 บัญชีไม่มีรหัสผ่าน (สมัครด้วย Google/LINE) · 429 ขอถี่เกิน — ข้อความของ backend อธิบายเอง
      alert.error(isApiError(e) ? e.message : t("sendFailed"));
    } finally {
      setSending(false);
    }
  }

  async function pickGoogle() {
    setSending(true);
    try {
      const result = await resetPasswordWithGoogle();
      if (result.status === "sent") setSent({ email: result.email, google: true });
      else if (result.status === "pickFailed") alert.error(t("pickGoogleFailed"));
      else if (result.status === "sendFailed") alert.error(isApiError(result.error) ? result.error.message : t("sendFailed"));
    } finally {
      setSending(false);
    }
  }

  return (
    // ระยะบนเท่าหน้าอื่นของหน้าร้าน (shopPage) — ให้พ้น Navbar แบบ fixed (สูง ~170px)
    <div className="min-h-[70vh] bg-[#f5f5f5] pb-16 pt-46 text-stone-800 sm:pt-50 md:pt-44">
      <div className="mx-auto max-w-[1200px] px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: t("forgotTitle") }]} className="!mb-4" />
        <h1 className="mb-6 text-xl font-bold text-stone-900 sm:text-2xl">{t("forgotTitle")}</h1>
        <div className={card}>
          {sent ? (
            <>
              <Mail className="mb-4 h-12 w-12 text-[#8C5A3C]" />
              <h2 className="mb-3 text-lg font-bold text-stone-900">{t("sentTitle")}</h2>
              <p className="mb-2 text-sm leading-relaxed text-stone-500">
                {t.rich("sentBody", { email: sent.email, b: (c) => <strong className="font-semibold text-stone-800">{c}</strong>, br: () => <br /> })}
              </p>
              <p className="mt-3 text-xs text-stone-500">{t("spamHint")}</p>
              {sent.google && (
                <a
                  href={`https://mail.google.com/mail/u/?authuser=${encodeURIComponent(sent.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${button} mt-6`}
                >
                  <Mail className="h-5 w-5" aria-hidden="true" />
                  {t("openGmail")}
                </a>
              )}
              <Link href={LOGIN_PATH} className={`${textLink} mt-6`}>
                {t("backToLogin")}
              </Link>
            </>
          ) : (
            <>
              <h2 className="mb-3 text-lg font-bold text-stone-900">{t("verifyIdentity")}</h2>
              <p className="mb-4 text-sm leading-relaxed text-stone-500">{t("enterEmailHint")}</p>
              <input
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                aria-label={t("email")}
                value={emailInput ?? user?.email ?? ""}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void sendTyped();
                }}
                className="mb-6 w-full max-w-xs h-[40px] rounded-lg border border-stone-200 px-4 text-sm text-stone-800 focus:border-[#4A342E] focus:outline-none focus:ring-2 focus:ring-[#4A342E]/30"
              />
              <button type="button" className={button} onClick={() => void sendTyped()} disabled={sending}>
                {sending ? t("sending") : t("sendLink")}
              </button>
              {GOOGLE_CLIENT_ID && (
                <button
                  type="button"
                  className={`${textLink} mt-5 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-wait disabled:opacity-60`}
                  onClick={() => void pickGoogle()}
                  disabled={sending}
                >
                  {t("useGoogle")}
                </button>
              )}
              <p className="mt-4 text-xs text-stone-500">{t("socialNoPassword")}</p>
              <Link href={LOGIN_PATH} className={`${textLink} mt-4`}>
                {t("backToLogin")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
