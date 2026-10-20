"use client";
// ─────────────────────────────────────────────────────────────
// ปุ่ม "เข้าสู่ระบบด้วย Google" — Google Identity Services (ID token) → POST /auth/google ของ backend หลัก
// (FrontOffice ใช้ signIn("google") ของ next-auth พอร์ต 4000 — backend หลักรองรับแบบ ID token แทน)
// GIS บังคับให้ใช้ปุ่มที่ Google วาดเอง (renderButton) — ตั้งธีม outline ให้ใกล้ปุ่มขาวของต้นแบบ
// ไม่ตั้ง NEXT_PUBLIC_GOOGLE_CLIENT_ID = แสดงปุ่มหน้าตาเดิมแบบกดไม่ได้
// ต้องเพิ่ม origin ของ frontend ใน Google Cloud Console → Authorized JavaScript origins
//
// โหลดสคริปต์ Google เมื่อผู้ใช้เริ่มใช้งานหน้าเท่านั้น (facade) — ชี้/โฟกัสปุ่ม หรือแตะ/เลื่อน/กดแป้นครั้งแรกที่ใดก็ได้
// เดิมโหลดทันทีที่เปิดหน้า: เบราว์เซอร์ที่ login Google อยู่ได้ cookie บุคคลที่สาม 16 ตัว + Issues
// (Lighthouse Best Practices 77) · ระหว่างยังไม่โหลดแสดงปุ่มหน้าตาเหมือนกัน — บนมือถือถ้าแตะปุ่มนี้เป็นอย่างแรก
// แตะครั้งแรกจะเริ่มโหลด แล้วแตะอีกครั้งที่ปุ่มของ Google
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { FcGoogle } from "react-icons/fc";
import { GOOGLE_CLIENT_ID, type GoogleOAuth2 } from "./googleAccountPicker";

const CLIENT_ID = GOOGLE_CLIENT_ID;

interface GoogleId {
  initialize(opts: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: "popup" }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}
declare global {
  interface Window {
    // oauth2 = หน้าต่างเลือกบัญชีของลิงก์ "ลืมรหัสผ่าน?" (googleAccountPicker.ts) — มากับสคริปต์ gsi/client ไฟล์เดียวกัน
    google?: { accounts: { id: GoogleId; oauth2?: GoogleOAuth2 } };
  }
}

export function GoogleLoginButton({ disabled, onCredential }: { disabled: boolean; onCredential: (credential: string) => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const slot = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // true = ผู้ใช้เริ่มใช้งานหน้าแล้ว → โหลดสคริปต์ Google
  const [wanted, setWanted] = useState(false);
  const want = () => setWanted(true);

  // การใช้งานครั้งแรกที่ใดก็ได้บนหน้า → โหลดไว้ก่อน (ส่วนใหญ่พร้อมก่อนผู้ใช้ไปถึงปุ่ม)
  useEffect(() => {
    if (wanted || !CLIENT_ID) return;
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    const on = () => setWanted(true);
    for (const e of events) window.addEventListener(e, on, { once: true, passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, on);
    };
  }, [wanted]);
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
        className="flex h-[40px] w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-[#e1d6cd] bg-white text-sm font-semibold text-[#4e342e] opacity-60"
      >
        <FcGoogle size={20} />
        {t("auth.loginWithGoogle")}
      </button>
    );
  }

  return (
    <>
      {wanted && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setReady(true)} />}
      {/* ปุ่มของ Google มุมโค้ง 4px — กรอบ rounded-xl (เท่าปุ่มอื่น) ตัดมุมแล้วเส้นขอบของ Google หายตรงมุม
          → วาดเส้นขอบโค้งทับเอง (สีเดียวกับขอบ Google #dadce0 · pointer-events-none ให้คลิกทะลุไปที่ปุ่ม) */}
      <div className={`relative flex h-[40px] w-full justify-center overflow-hidden rounded-xl bg-white ${disabled ? "pointer-events-none opacity-60" : ""}`}>
        {/* ช่องที่ Google วาดปุ่มลงไป — ไม่ใส่ aria-label (div ไม่มี role ใส่ไม่ได้ · ปุ่มของ Google/ปุ่มแทนมีข้อความของตัวเอง) */}
        <div ref={slot} className="w-full" />
        {/* ปุ่มแทนระหว่างยังไม่โหลดสคริปต์ Google — หน้าตาเหมือนปุ่ม outline ของ Google · ชี้/โฟกัส/กด = เริ่มโหลด */}
        {!ready && (
          <button
            type="button"
            onPointerEnter={want}
            onFocus={want}
            onClick={want}
            aria-busy={wanted}
            className="absolute inset-0 flex cursor-pointer items-center justify-center gap-2.5 border-none bg-white text-[14.5px] font-medium text-[#3c4043]"
          >
            <FcGoogle size={18} />
            {t("auth.loginWithGoogle")}
          </button>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl border border-[#dadce0]" />
      </div>
    </>
  );
}
