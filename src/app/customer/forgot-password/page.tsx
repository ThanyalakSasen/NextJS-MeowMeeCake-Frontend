"use client";
// ─────────────────────────────────────────────────────────────
// /customer/forgot-password — ขอลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล (ลิงก์ "ลืมรหัสผ่าน?" ในหน้า /login)
// ยกจาก FrontOffice src/app/customer/forgot-password/page.tsx (โหมด guest) · API POST /auth/forgot-password
// ล็อกอินอยู่ = เติมอีเมลบัญชีให้ (โหมด "เปลี่ยนรหัสผ่าน" + เมนูบัญชีของ FrontOffice → รวมกับ BACKLOG3-merge B2)
// backend ตอบเหมือนกันไม่ว่าอีเมลจะมีในระบบไหม (กันเดาอีเมล) · บัญชี Google/LINE ที่ไม่มีรหัสผ่าน = 400 พร้อมข้อความ
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
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
  const { user } = useCustomerSession();
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const email = (emailInput ?? user?.email ?? "").trim();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!EMAIL_RE.test(email)) {
      alert.warning("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    setSending(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      alert.error(isApiError(e) ? e.message : "ส่งลิงก์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#f5f5f5] pb-16 pt-32 text-stone-800 sm:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-xl font-bold text-stone-900 sm:text-2xl">ลืมรหัสผ่าน</h1>
        <div className={card}>
          {sent ? (
            <>
              <Mail className="mb-4 h-12 w-12 text-[#8C5A3C]" />
              <h2 className="mb-3 text-lg font-bold text-stone-900">ส่งลิงก์เรียบร้อยแล้ว</h2>
              <p className="mb-2 text-sm leading-relaxed text-stone-500">
                หากอีเมล <strong className="font-semibold text-stone-800">{email}</strong> มีบัญชีอยู่ในระบบ
                เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว
                <br />
                กรุณาตรวจสอบอีเมลและกดลิงก์ภายใน <strong className="font-semibold text-stone-800">1 ชั่วโมง</strong>
              </p>
              <p className="mt-3 text-xs text-stone-400">ไม่เจออีเมล? ลองตรวจสอบในกล่องสแปม</p>
              <Link href={LOGIN_PATH} className="mt-6 text-sm font-semibold text-[#4A342E] hover:underline">
                กลับหน้าเข้าสู่ระบบ
              </Link>
            </>
          ) : (
            <>
              <h2 className="mb-3 text-lg font-bold text-stone-900">ยืนยันตัวตนของคุณ</h2>
              <p className="mb-4 text-sm leading-relaxed text-stone-500">
                กรอกอีเมลที่ใช้สมัครสมาชิก ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้
              </p>
              <input
                type="email"
                autoComplete="email"
                placeholder="กรอกอีเมล"
                aria-label="อีเมล"
                value={emailInput ?? user?.email ?? ""}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
                className="mb-6 w-full max-w-xs rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-800 focus:border-[#4A342E] focus:outline-none focus:ring-2 focus:ring-[#4A342E]/30"
              />
              <button type="button" className={button} onClick={() => void send()} disabled={sending}>
                {sending ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
              </button>
              <p className="mt-4 text-xs text-stone-400">
                บัญชีที่สมัครด้วย Google หรือ LINE ไม่มีรหัสผ่าน — เข้าสู่ระบบด้วยปุ่ม Google / LINE ได้เลย
              </p>
              <Link href={LOGIN_PATH} className="mt-4 text-sm font-semibold text-[#4A342E] hover:underline">
                กลับหน้าเข้าสู่ระบบ
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
