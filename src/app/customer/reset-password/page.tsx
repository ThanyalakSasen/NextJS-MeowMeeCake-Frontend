"use client";
// ─────────────────────────────────────────────────────────────
// /customer/reset-password?token= — ตั้งรหัสผ่านใหม่จากลิงก์ในอีเมล (ใช้ครั้งเดียว · หมดอายุ 1 ชม.)
// ยกจาก FrontOffice src/app/customer/reset-password/page.tsx · API GET (เช็คลิงก์) + POST /auth/reset-password { token, newPassword }
// CustomerChrome ซ่อน Navbar/Footer ของหน้านี้อยู่แล้ว (HIDE_CHROME_ROUTES)
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Lock, LockOpen, XCircle } from "lucide-react";
import { checkResetToken, resetPassword } from "@/lib/authClient";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { LOGIN_PATH, MIN_PASSWORD_LENGTH } from "@/constants/auth";

const MAX_PASSWORD = 72;
const page = "flex min-h-screen items-center justify-center bg-[#f8f6f3] p-5";
const card =
  "w-full max-w-[420px] rounded-2xl border border-[#8C5A3C]/10 bg-white p-9 text-center shadow-[0_10px_30px_rgba(74,52,46,0.08)]";
const outlineButton =
  "w-full rounded-xl border border-[#8C5A3C]/30 bg-white py-3 text-sm font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98]";
const input =
  "w-full rounded-xl border border-[#e2d9d5] bg-[#fcfcfc] py-3 pl-3.5 pr-11 text-sm text-[#4a342e] outline-none transition placeholder:text-[#b0a5a0] focus:border-[#8C5A3C] focus:bg-white focus:ring-4 focus:ring-[#8C5A3C]/15";

function PasswordField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="mb-5 block text-left">
      <span className="mb-1.5 block text-sm font-semibold text-[#4a342e]">{label}</span>
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
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
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
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [tokenValid, setTokenValid] = useState<boolean | null>(token ? null : false); // null = กำลังเช็ค
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    void checkResetToken(token).then(setTokenValid);
  }, [token]);

  const submit = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      alert.warning(`รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
      return;
    }
    if (password !== confirm) {
      alert.warning("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (e) {
      // ซ้ำรหัสเดิม / ลิงก์ถูกใช้ไปแล้ว — ข้อความของ backend
      alert.error(isApiError(e) ? e.message : "ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className={page}>
        <div className={card}>
          <p className="m-0 text-base font-medium text-[#8C5A3C]">กำลังตรวจสอบลิงก์...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className={page}>
        <div className={card}>
          <XCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
          <h1 className="mb-2 text-xl font-bold text-red-700">ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</h1>
          <p className="mb-6 text-sm leading-relaxed text-[#77665e]">ลิงก์ตั้งรหัสผ่านใหม่ใช้ได้ครั้งเดียวและหมดอายุใน 1 ชั่วโมง</p>
          <button type="button" className={`${outlineButton} mb-3`} onClick={() => router.push("/customer/forgot-password")}>
            ขอลิงก์ใหม่
          </button>
          <button type="button" className={outlineButton} onClick={() => router.push(LOGIN_PATH)}>
            กลับหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className={page}>
        <div className={card}>
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
          <h1 className="mb-2 text-xl font-bold text-green-700">เปลี่ยนรหัสผ่านสำเร็จ</h1>
          <p className="mb-6 text-sm leading-relaxed text-[#77665e]">คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว</p>
          <button type="button" className={outlineButton} onClick={() => router.push(LOGIN_PATH)}>
            ไปหน้าเข้าสู่ระบบ
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
        <h1 className="mb-2 text-xl font-bold text-[#4a342e]">ตั้งรหัสผ่านใหม่</h1>
        <p className="mb-6 text-sm leading-relaxed text-[#77665e]">รหัสผ่านต้องมีอย่างน้อย {MIN_PASSWORD_LENGTH} ตัวอักษร</p>

        <PasswordField label="รหัสผ่านใหม่" value={password} onChange={setPassword} placeholder={`อย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`} />
        <PasswordField label="ยืนยันรหัสผ่านใหม่" value={confirm} onChange={setConfirm} placeholder="กรอกรหัสผ่านอีกครั้ง" />

        <button
          type="button"
          className={`mt-2.5 w-full rounded-xl py-3.5 text-base font-bold transition-all duration-200 ${
            disabled
              ? "cursor-not-allowed border border-[#d1c7c2] bg-[#d1c7c2] text-white shadow-none"
              : "border border-[#8C5A3C]/30 bg-white text-[#4A342E] shadow-md shadow-[#4A342E]/20 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98]"
          }`}
          onClick={() => void submit()}
          disabled={disabled}
        >
          {submitting ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </button>
      </div>
    </div>
  );
}

// useSearchParams() ต้องอยู่ใต้ <Suspense> ให้ prerender ได้
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
