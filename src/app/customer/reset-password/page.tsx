"use client";
// ─────────────────────────────────────────────────────────────
// /customer/reset-password?token= — ตั้งรหัสผ่านใหม่จากลิงก์ในอีเมล (ใช้ครั้งเดียว · หมดอายุ 1 ชม.)
// ยกจาก FrontOffice src/app/customer/reset-password/page.tsx · API GET (เช็คลิงก์) + POST /auth/reset-password { token, newPassword }
// CustomerChrome ซ่อน Navbar/Footer ของหน้านี้อยู่แล้ว (HIDE_CHROME_ROUTES)
// บันทึกสำเร็จ → พากลับหน้า /login ทันที + แจ้ง "เปลี่ยนรหัสผ่านสำเร็จ" (AlertHost อยู่ที่ providers จึงค้างข้ามหน้าได้)
// ลิงก์หมดอายุ/ใช้ไปแล้ว → "ขอลิงก์ใหม่" = เปิดหน้าต่างเลือกบัญชี Google แล้วส่งลิงก์ใหม่ไปอีเมลนั้นทันที (ไม่ต้องไปกรอกอีเมลอีกหน้า)
//   ไม่ได้ตั้ง Google client / เลือกบัญชีไม่ได้ → ไปหน้า /customer/forgot-password แบบเดิม · "ใช้อีเมลอื่น" ไปหน้าเดิมเสมอ
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Lock, LockOpen, Mail, XCircle } from "lucide-react";
import { checkResetToken, resetPassword } from "@/lib/authClient";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { LOGIN_PATH, MIN_PASSWORD_LENGTH } from "@/constants/auth";
import { GOOGLE_CLIENT_ID, preloadGoogleAccountPicker } from "@/app/login/_components/googleAccountPicker";
import { resetPasswordWithGoogle } from "@/app/login/_components/forgotPasswordFlow";

const MAX_PASSWORD = 72;
const page = "flex min-h-screen items-center justify-center bg-[#f8f6f3] p-5";
const card =
  "w-full max-w-[420px] rounded-2xl border border-[#8C5A3C]/10 bg-white p-9 text-center shadow-[0_10px_30px_rgba(74,52,46,0.08)]";
const outlineButton =
  "h-[44px] w-full rounded-xl border border-[#8C5A3C]/30 bg-white text-sm font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98]";
const input =
  "w-full rounded-xl border border-[#e2d9d5] bg-[#fcfcfc] h-[40px] pl-3.5 pr-11 text-sm text-[#4a342e] outline-none transition placeholder:text-[#b0a5a0] focus:border-[#8C5A3C] focus:bg-white focus:ring-4 focus:ring-[#8C5A3C]/15";

function PasswordField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const t = useTranslations("shop.password");
  const [show, setShow] = useState(false);
  return (
    <label className="mb-5 block text-left">
      <span className="mb-1.5 block text-sm font-semibold text-[#4a342e]">{label}<span className="ml-0.5 text-red-500" aria-hidden="true">*</span></span>
      <span className="relative flex items-center">
        <input
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          value={value}
          maxLength={MAX_PASSWORD}
          onChange={(e) => onChange(e.target.value)}
          className={input}
        />
        <button
          type="button"
          aria-label={show ? t("hide") : t("show")}
          className="absolute right-3 text-[#8C5A3C] opacity-70 transition hover:opacity-100"
          onClick={() => setShow((v) => !v)}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
    </label>
  );
}

function ResetPasswordContent() {
  const t = useTranslations("shop.password");
  const tc = useTranslations("shop.common");
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [tokenValid, setTokenValid] = useState<boolean | null>(token ? null : false); // null = กำลังเช็ค
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // ขอลิงก์ใหม่ด้วยบัญชี Google — ส่งแล้วแสดงอีเมลที่ส่งไป
  const [requesting, setRequesting] = useState(false);
  const [resent, setResent] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void checkResetToken(token).then(setTokenValid);
  }, [token]);

  // ลิงก์ใช้ไม่ได้ → โหลดสคริปต์ Google ไว้ก่อน ให้หน้าต่างเลือกบัญชีเปิดทันทีตอนกด
  useEffect(() => {
    if (tokenValid === false && GOOGLE_CLIENT_ID) preloadGoogleAccountPicker();
  }, [tokenValid]);

  const requestNewLink = async () => {
    if (!GOOGLE_CLIENT_ID) return router.push("/customer/forgot-password");
    setRequesting(true);
    try {
      const r = await resetPasswordWithGoogle();
      if (r.status === "sent") setResent(r.email);
      else if (r.status === "pickFailed") router.push("/customer/forgot-password");
      else if (r.status === "sendFailed") alert.error(isApiError(r.error) ? r.error.message : t("sendFailed"));
    } finally {
      setRequesting(false);
    }
  };

  const submit = async () => {
    // ช่องว่างล้วน ยาวพอแต่ใช้เป็นรหัสผ่านไม่ได้
    if (!password.trim()) {
      alert.warning(t("blank"));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      alert.warning(t("minLength", { n: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (password !== confirm) {
      alert.warning(t("mismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
    } catch (e) {
      // ซ้ำรหัสเดิม / ลิงก์ถูกใช้ไปแล้ว — ข้อความของ backend
      alert.error(isApiError(e) ? e.message : t("resetFailed"));
      setSubmitting(false);
      return;
    }
    // ไม่ปลด submitting — กันกดซ้ำระหว่างเปลี่ยนหน้า
    void alert.success(t("resetDone"), { title: t("changed") });
    router.replace(LOGIN_PATH);
  };

  if (tokenValid === null) {
    return (
      <div className={page}>
        <div className={card}>
          <p className="m-0 text-base font-medium text-[#8C5A3C]">{t("checkingLink")}</p>
        </div>
      </div>
    );
  }

  if (!tokenValid && resent) {
    return (
      <div className={page}>
        <div className={card}>
          <Mail className="mx-auto mb-3 h-10 w-10 text-[#8C5A3C]" />
          <h1 className="mb-2 text-xl font-bold text-[#4a342e]">{t("sentTitle")}</h1>
          <p className="mb-2 text-sm leading-relaxed text-[#77665e]">
            {t.rich("sentBody", { email: resent, b: (c) => <strong className="font-semibold text-[#4a342e]">{c}</strong>, br: () => <br /> })}
          </p>
          <p className="mb-6 text-xs text-[#77665e]">{t("spamHint")}</p>
          <a
            href={`https://mail.google.com/mail/u/?authuser=${encodeURIComponent(resent)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${outlineButton} mb-3 flex items-center justify-center gap-2`}
          >
            <Mail className="h-5 w-5" aria-hidden="true" />
            {t("openGmail")}
          </a>
          <button type="button" className={outlineButton} onClick={() => router.push(LOGIN_PATH)}>
            {t("backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className={page}>
        <div className={card}>
          <XCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
          <h1 className="mb-2 text-xl font-bold text-red-700">{t("linkInvalid")}</h1>
          <p className="mb-6 text-sm leading-relaxed text-[#77665e]">{t("linkRule")}</p>
          <button type="button" className={`${outlineButton} mb-1`} onClick={() => void requestNewLink()} disabled={requesting}>
            {requesting ? t("sending") : t("requestNew")}
          </button>
          {GOOGLE_CLIENT_ID && (
            <p className="mb-3 text-xs text-[#77665e]">
              {t("requestNewHint")}{" "}
              <button type="button" className="font-semibold text-[#4A342E] underline" onClick={() => router.push("/customer/forgot-password")}>
                {t("useOtherEmail")}
              </button>
            </p>
          )}
          <button type="button" className={outlineButton} onClick={() => router.push(LOGIN_PATH)}>
            {t("backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  // รหัสทั้งสองช่องตรงกัน → แม่กุญแจปลดล็อก + เปลี่ยนสีพื้นหลัง
  const matched = password.length > 0 && password === confirm;
  const disabled = submitting || !password || !confirm;

  return (
    <div className={page}>
      <div className={card}>
        <div
          className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
            matched ? "bg-green-100 text-green-600" : "bg-[#f4efe8] text-[#8C5A3C]"
          }`}
        >
          {matched ? <LockOpen className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
        </div>
        <h1 className="mb-2 text-xl font-bold text-[#4a342e]">{t("setNew")}</h1>
        <p className="mb-6 text-sm leading-relaxed text-[#77665e]">{t("minLength", { n: MIN_PASSWORD_LENGTH })}</p>

        <PasswordField label={t("new")} value={password} onChange={setPassword} placeholder={t("atLeast", { n: MIN_PASSWORD_LENGTH })} />
        <PasswordField label={t("confirmNew")} value={confirm} onChange={setConfirm} placeholder={t("retype")} />

        <button
          type="button"
          className={`mt-2.5 h-[44px] w-full rounded-xl text-sm font-bold transition-all duration-200 ${
            disabled
              ? "cursor-not-allowed border border-[#d1c7c2] bg-[#d1c7c2] text-white shadow-none"
              : "border border-[#8C5A3C]/30 bg-white text-[#4A342E] shadow-md shadow-[#4A342E]/20 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98]"
          }`}
          onClick={() => void submit()}
          disabled={disabled}
        >
          {submitting ? tc("saving") : t("saveNew")}
        </button>
      </div>
    </div>
  );
}

// useSearchParams() ต้องอยู่ใต้ <Suspense> ให้ prerender ได้
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
