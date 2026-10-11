"use client";
// ─────────────────────────────────────────────────────────────
// หน้า login — หน้าตายกมาจาก FrontOffice (Downloads/frontend/frontend src/app/login/page.jsx)
// ภาพพื้นหลังเต็มจอ (public/login.png) · มือถือ = การ์ดโปร่งบนภาพ · จอใหญ่ = การ์ดขาว
// แม่กุญแจปลดล็อกเมื่ออีเมลถูกรูปแบบ / login สำเร็จ · ปุ่มยุบ-เด้งตอนกด (globals.css jellyPress/lockPop)
// ปุ่ม Google = Google Identity Services → POST /auth/google · ปุ่ม LINE = พาไป GET /auth/line ของ backend → กลับมา /login/line
// ไม่ยกมา (docs/BACKLOG3-merge.md B3): วิดีโอห้องอบขนม · ม่านตอน logout
// ตรรกะยังเป็นของ repo นี้: login() ของ backend หลัก · ?next= ตาม role · 403 EMAIL_NOT_VERIFIED → ขอลิงก์ยืนยันใหม่
// 423 ACCOUNT_LOCKED / 429 → แจ้งว่าล็อกกี่นาที + นับถอยหลังใต้ฟอร์ม (ปิดปุ่มเข้าสู่ระบบจนครบเวลา · เฉพาะอีเมลที่โดนล็อก)
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import { FaLine } from "react-icons/fa";
import { ACCOUNT_LOCKED, EMAIL_NOT_VERIFIED, lineLoginUrl, login, loginWithGoogle, resendVerification } from "@/lib/authClient";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { CurrentUser } from "@/types/auth";
import { nextPathFor } from "../nextPath";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { AuthBackdrop, authInputClass as inputClass, authLabelClass as labelClass, authLinkClass, authMutedClass } from "@/components/shared/layout/AuthBackdrop";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// หน้าสมัคร / ลืมรหัสผ่าน — path เดียวกับ FrontOffice + ลิงก์ในอีเมลของ backend (BACKLOG3-merge B1)
const REGISTER_PATH = "/register";
const FORGOT_PASSWORD_PATH = "/customer/forgot-password";

const iconSlot = "absolute top-1/2 right-3.5 -translate-y-1/2 flex items-center justify-center";

/** เวลาที่ครบกำหนดอีก sec วินาทีจากตอนนี้ (เรียกใน event handler เท่านั้น) */
const deadlineIn = (sec: number) => Date.now() + sec * 1000;

/** วินาที → "14:05" */
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

/** ล็อกชั่วคราว: ถึงเวลาไหน · อีเมลไหน · ล็อกจากบัญชี (423) หรือขอถี่เกิน (429) */
type Lockout = { until: number; email: string; kind: "locked" | "tooMany" };

/** วินาทีที่เหลือของ lockout — อัปเดตทุกวินาที · หมดเวลา = 0 */
function useSecondsLeft(until: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

function Form() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordCorrect, setPasswordCorrect] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [lockout, setLockout] = useState<Lockout | null>(null);
  const secondsLeft = useSecondsLeft(lockout?.until ?? null);
  // ล็อกเฉพาะอีเมลที่โดน — เปลี่ยนไปใช้อีเมลอื่นกดได้ตามปกติ
  const locked = !!lockout && secondsLeft > 0 && lockout.email === email.trim().toLowerCase();

  const emailValid = EMAIL_RE.test(email.trim());
  const goNext = (user: CurrentUser) => {
    // ล้าง cache ตอนเป็น guest (session ว่าง · ตะกร้า ฯลฯ) — ไม่งั้นกลับไปหน้า ?next= (เช่นลิงก์คำสั่งซื้อจาก LINE) แล้วยังเห็นการ์ดชวนล็อกอิน
    qc.clear();
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
      const isLocked = isApiError(e2) && e2.reason === ACCOUNT_LOCKED;
      const isTooMany = isApiError(e2) && e2.code === "TOO_MANY_REQUESTS";
      if ((isLocked || isTooMany) && e2.retryAfterSeconds) {
        setLockout({
          until: deadlineIn(e2.retryAfterSeconds),
          email: email.trim().toLowerCase(),
          kind: isLocked ? "locked" : "tooMany",
        });
        alert.error(isLocked ? t("auth.accountLocked", { minutes: Math.ceil(e2.retryAfterSeconds / 60) }) : e2.message);
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
    <AuthBackdrop title={t("auth.loginTitle")}>
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

        {locked && (
          <div role="status" className="mt-2 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
            <Lock size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="m-0 font-semibold">
                {lockout!.kind === "locked" ? t("auth.lockedCountdown") : t("auth.tooManyCountdown")}{" "}
                <span className="font-mono text-base tabular-nums">{mmss(secondsLeft)}</span>
              </p>
              {lockout!.kind === "locked" && <p className="m-0 mt-0.5 text-xs text-rose-600/90">{t("auth.lockedHint")}</p>}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || locked}
          aria-busy={busy}
          onMouseDown={() => setPressed(true)}
          onAnimationEnd={() => setPressed(false)}
          className={`mt-5 cursor-pointer rounded-xl border-none bg-[#f2ae00] py-3.5 text-base font-bold text-white shadow-[0_4px_12px_rgba(242,174,0,0.25)] transition-all disabled:cursor-wait ${
            locked ? "!cursor-not-allowed !bg-[#e1d6cd] !shadow-none" : ""
          } ${
            busy
              ? "!bg-white !text-[#a19285] !shadow-none border-[1.5px] border-[#e1d6cd]"
              : "hover:enabled:-translate-y-px hover:enabled:bg-[#d99c00] hover:enabled:shadow-[0_6px_16px_rgba(242,174,0,0.35)]"
          } ${pressed ? "animate-jelly" : ""}`}
        >
          {busy ? (
            <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-[#e1d6cd] border-t-[#f2ae00]" />
          ) : locked ? (
            <span className="tabular-nums">{mmss(secondsLeft)}</span>
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

      <p className={`pt-5 text-center text-xs sm:text-sm ${authMutedClass}`}>
        {t("auth.noAccount")}{" "}
        <Link href={REGISTER_PATH} className={authLinkClass}>
          {t("auth.register")}
        </Link>
      </p>
    </AuthBackdrop>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
