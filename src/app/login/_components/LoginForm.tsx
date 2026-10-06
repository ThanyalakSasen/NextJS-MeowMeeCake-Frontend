"use client";
// ─────────────────────────────────────────────────────────────
// หน้า login — หน้าตายกมาจาก FrontOffice (Downloads/frontend/frontend src/app/login/page.jsx)
// ภาพพื้นหลังเต็มจอ (public/login.png) · มือถือ = การ์ดโปร่งบนภาพ · จอใหญ่ = การ์ดขาว
// แม่กุญแจปลดล็อกเมื่ออีเมลถูกรูปแบบ / login สำเร็จ · ปุ่มยุบ-เด้งตอนกด (globals.css jellyPress/lockPop)
// ปุ่ม Google = Google Identity Services → POST /auth/google · ปุ่ม LINE = พาไป GET /auth/line ของ backend → กลับมา /login/line
// ไม่ยกมา (docs/BACKLOG3-merge.md B3): วิดีโอห้องอบขนม · ม่านตอน logout
// ตรรกะยังเป็นของ repo นี้: login() ของ backend หลัก · ?next= ตาม role · 403 EMAIL_NOT_VERIFIED → ขอลิงก์ยืนยันใหม่
// ─────────────────────────────────────────────────────────────
import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, LockOpen } from "lucide-react";
import { FaLine } from "react-icons/fa";
import { EMAIL_NOT_VERIFIED, lineLoginUrl, login, loginWithGoogle, resendVerification } from "@/lib/authClient";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { CurrentUser } from "@/types/auth";
import { nextPathFor } from "../nextPath";
import { GoogleLoginButton } from "./GoogleLoginButton";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// หน้าสมัคร / ลืมรหัสผ่าน — path เดียวกับ FrontOffice + ลิงก์ในอีเมลของ backend (ยังไม่ได้สร้าง — BACKLOG3-merge B1)
const REGISTER_PATH = "/register";
const FORGOT_PASSWORD_PATH = "/customer/forgot-password";

// มือถือ: ตัวอักษรขาวบนภาพ · จอใหญ่ (md): การ์ดขาว ตัวอักษรน้ำตาล
const inputClass =
  "w-full px-3.5 py-3 pr-11 rounded-xl text-sm outline-none transition bg-white/90 md:bg-white border-0 md:border-[1.5px] md:border-[#e1d6cd] text-[#1a1a1a] md:text-inherit focus:ring-4 focus:ring-[#f2ae00]/15 md:focus:border-[#f2ae00]";
const labelClass =
  "text-[14.5px] font-semibold text-white md:text-[#4e342e] [text-shadow:0_1px_3px_rgba(0,0,0,0.3)] md:[text-shadow:none]";
const iconSlot = "absolute top-1/2 right-3.5 -translate-y-1/2 flex items-center justify-center";

function Form() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordCorrect, setPasswordCorrect] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const goNext = (user: CurrentUser) => {
    router.replace(nextPathFor(user.roleType, params.get("next")));
    router.refresh();
  };

  async function handleGoogle(credential: string) {
    setBusy(true);
    try {
      goNext(await loginWithGoogle(credential));
    } catch (e2) {
      setBusy(false);
      alert.error(isApiError(e2) ? e2.message : t("auth.socialLoginFailed"));
    }
  }

  function handleLine() {
    setLineLoading(true);
    window.location.assign(lineLoginUrl(params.get("next")));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      alert.warning(t("auth.missingFields"));
      return;
    }
    setBusy(true);
    try {
      const user = await login({ email: email.trim(), password });
      setPasswordCorrect(true);
      goNext(user);
    } catch (e2) {
      setBusy(false);
      if (isApiError(e2) && e2.status === 403 && e2.reason === EMAIL_NOT_VERIFIED) {
        await offerResendVerification(email.trim());
        return;
      }
      // แจ้งด้วย toast เหมือนหน้าอื่นทั้งหมด (ดู docs/BACKLOG.md §9)
      alert.error(isApiError(e2) ? e2.message : t("auth.loginFailed"));
    }
  }

  // ลูกค้ายังไม่ยืนยันอีเมล (403 EMAIL_NOT_VERIFIED) — ถามว่าจะขอลิงก์ยืนยันใหม่ไหม
  async function offerResendVerification(to: string) {
    const ok = await confirmAlert(t("auth.emailNotVerifiedDetail"), {
      title: t("auth.emailNotVerified"),
      confirmText: t("auth.resendVerification"),
      cancelText: t("common.cancel"),
    });
    if (!ok) return;
    try {
      await resendVerification(to);
      alert.success(t("auth.resendVerificationSent"));
    } catch (e3) {
      // 429 = ขอถี่เกิน — ข้อความของ backend บอกให้รอเอง
      alert.error(isApiError(e3) ? e3.message : t("auth.resendVerificationFailed"));
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#fcf9f6] p-4 md:bg-[radial-gradient(circle_at_15%_20%,#fff5ee_0%,#fcf9f6_100%)] md:p-5">
      {/* ภาพพื้นหลังเต็มจอ + ไล่เงาบนมือถือให้อ่านตัวอักษรขาวออก */}
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

      <div className="relative z-10 mx-auto w-full max-w-[480px]">
        <div className="rounded-3xl border border-white/25 bg-white/16 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:border-[#e6dace]/50 md:bg-white md:p-10 md:shadow-[0_12px_40px_rgba(74,52,46,0.05)] md:backdrop-blur-none">
          <h1 className="mb-6 text-center text-2xl font-bold -tracking-[0.5px] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.3)] md:text-[26px] md:text-[#3e2723] md:[text-shadow:none]">
            {t("auth.loginTitle")}
          </h1>

          <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
            <label htmlFor="login-email" className={labelClass}>
              {t("auth.email")}
            </label>
            <div className="relative w-full">
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className={inputClass}
                required
              />
              {emailValid && (
                <span className={`${iconSlot} pointer-events-none text-green-700`} aria-hidden="true">
                  <LockOpen size={18} className="animate-lock-pop" />
                </span>
              )}
            </div>

            <label htmlFor="login-password" className={labelClass}>
              {t("auth.password")}
            </label>
            <div className="relative w-full">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordCorrect(false);
                }}
                placeholder={t("auth.passwordPlaceholder")}
                className={inputClass}
                required
              />
              {passwordCorrect ? (
                <span className={`${iconSlot} pointer-events-none text-green-700`} aria-hidden="true">
                  <LockOpen size={18} className="animate-lock-pop" />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  className={`${iconSlot} text-[#a19285] hover:text-[#4e342e]`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
            </div>

            <div className="-mt-1 flex justify-end">
              <Link href={FORGOT_PASSWORD_PATH} className="text-xs font-semibold text-[#F2AE00] hover:underline sm:text-sm md:text-[#8C5A3C]">
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              onMouseDown={() => setPressed(true)}
              onAnimationEnd={() => setPressed(false)}
              className={`mt-5 cursor-pointer rounded-xl border-none bg-[#f2ae00] py-3.5 text-base font-bold text-white shadow-[0_4px_12px_rgba(242,174,0,0.25)] transition-all disabled:cursor-wait ${
                busy
                  ? "!bg-white !text-[#a19285] !shadow-none border-[1.5px] border-[#e1d6cd]"
                  : "hover:enabled:-translate-y-px hover:enabled:bg-[#d99c00] hover:enabled:shadow-[0_6px_16px_rgba(242,174,0,0.35)]"
              } ${pressed ? "animate-jelly" : ""}`}
            >
              {busy ? (
                <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-[#e1d6cd] border-t-[#f2ae00]" />
              ) : (
                t("auth.submit")
              )}
            </button>
          </form>

          <div className="my-4 text-center text-[#a19285]">{t("auth.or")}</div>

          <GoogleLoginButton disabled={busy || lineLoading} onCredential={handleGoogle} />

          <button
            type="button"
            onClick={handleLine}
            disabled={busy || lineLoading}
            className={`mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-[14.5px] font-semibold text-white transition-all ${
              lineLoading ? "cursor-wait bg-[#06C755]/60" : "bg-[#06C755] hover:enabled:bg-[#05b14c]"
            }`}
          >
            <FaLine size={20} />
            {lineLoading ? t("auth.redirectingToLine") : t("auth.loginWithLine")}
          </button>

          <p className="pt-5 text-center text-xs text-stone-200 sm:text-sm md:text-stone-500">
            {t("auth.noAccount")}{" "}
            <Link href={REGISTER_PATH} className="font-bold text-[#F2AE00] hover:underline md:text-[#4A342E]">
              {t("auth.register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
