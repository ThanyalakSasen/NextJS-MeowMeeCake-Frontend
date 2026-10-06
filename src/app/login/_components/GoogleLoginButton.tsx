"use client";
// ─────────────────────────────────────────────────────────────
// ปุ่ม "เข้าสู่ระบบด้วย Google" — Google Identity Services (ID token) → POST /auth/google ของ backend หลัก
// (FrontOffice ใช้ signIn("google") ของ next-auth พอร์ต 4000 — backend หลักรองรับแบบ ID token แทน)
// GIS บังคับให้ใช้ปุ่มที่ Google วาดเอง (renderButton) — ตั้งธีม outline ให้ใกล้ปุ่มขาวของต้นแบบ
// ไม่ตั้ง NEXT_PUBLIC_GOOGLE_CLIENT_ID = แสดงปุ่มหน้าตาเดิมแบบกดไม่ได้
// ต้องเพิ่ม origin ของ frontend ใน Google Cloud Console → Authorized JavaScript origins
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { FcGoogle } from "react-icons/fc";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

interface GoogleId {
  initialize(opts: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: "popup" }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

export function GoogleLoginButton({ disabled, onCredential }: { disabled: boolean; onCredential: (credential: string) => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const slot = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // callback ล่าสุดเสมอ — GIS เก็บ callback ตัวแรกที่ initialize ไว้
  const callbackRef = useRef(onCredential);
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const gid = window.google?.accounts.id;
    if (!ready || !gid || !slot.current) return;
    gid.initialize({
      client_id: CLIENT_ID,
      ux_mode: "popup",
      callback: (r) => r.credential && callbackRef.current(r.credential),
    });
    gid.renderButton(slot.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: "signin_with",
      logo_alignment: "center",
      width: Math.min(400, slot.current.offsetWidth || 400),
      locale,
    });
  }, [ready, locale]);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title={t("auth.googleNotConfigured")}
        className="flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-[#e1d6cd] bg-white py-3 text-[14.5px] font-semibold text-[#4e342e] opacity-60"
      >
        <FcGoogle size={20} />
        {t("auth.loginWithGoogle")}
      </button>
    );
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setReady(true)} />
      <div className={`flex min-h-[44px] w-full justify-center overflow-hidden rounded-xl bg-white ${disabled ? "pointer-events-none opacity-60" : ""}`}>
        <div ref={slot} className="w-full" aria-label={t("auth.loginWithGoogle")} />
      </div>
    </>
  );
}
