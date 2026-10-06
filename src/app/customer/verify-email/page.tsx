"use client";
// ─────────────────────────────────────────────────────────────
// /customer/verify-email?token= — ลิงก์ในอีเมลยืนยันบัญชี (backend mailer → STOREFRONT_URL/customer/verify-email)
// ยกจาก FrontOffice src/app/customer/verify-email/page.tsx · เปลี่ยน API เป็น GET /auth/verify-email (เดิม /api/user/verify-email)
// ยืนยันแล้ว backend ไม่ล็อกอินให้ → พาไปหน้าเข้าสู่ระบบ (FrontOffice พาไป /customer เพราะ next-auth ล็อกอินค้างไว้ได้)
// token ใช้ได้ครั้งเดียว — React dev เรียก effect 2 รอบ จึงกันด้วย ref ไม่ให้ยิงซ้ำแล้วขึ้น "ลิงก์หมดอายุ"
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { verifyEmail } from "@/lib/authClient";
import { isApiError } from "@/types/api";
import { LOGIN_PATH } from "@/constants/auth";

const REDIRECT_MS = 2500;
const card =
  "w-full max-w-[420px] rounded-2xl border border-[#8C5A3C]/10 bg-white p-9 text-center shadow-[0_10px_30px_rgba(74,52,46,0.08)]";
const button =
  "mt-6 block w-full rounded-xl border border-[#8C5A3C]/30 bg-white py-3 text-sm font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98]";

type Status = { kind: "loading" } | { kind: "success"; message?: string } | { kind: "error"; message?: string };

function VerifyEmailContent() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? { kind: "loading" } : { kind: "error" });
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then((message) => {
        setStatus({ kind: "success", message });
        setTimeout(() => router.push(LOGIN_PATH), REDIRECT_MS);
      })
      .catch((e) => setStatus({ kind: "error", message: isApiError(e) ? e.message : undefined }));
  }, [token, router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f8f6f3] p-5">
      <div className={card}>
        {status.kind === "loading" && (
          <>
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-[#8C5A3C]" />
            <p className="m-0 text-base font-medium text-[#8C5A3C]">กำลังยืนยันอีเมล...</p>
          </>
        )}
        {status.kind === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
            <h1 className="mb-2 text-xl font-bold text-green-700">ยืนยันอีเมลสำเร็จ!</h1>
            <p className="m-0 text-sm leading-relaxed text-[#77665e]">
              {status.message ?? "บัญชีของคุณพร้อมใช้งานแล้ว"} — กำลังพาไปหน้าเข้าสู่ระบบ...
            </p>
            <Link href={LOGIN_PATH} className={button}>เข้าสู่ระบบ</Link>
          </>
        )}
        {status.kind === "error" && (
          <>
            <XCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
            <h1 className="mb-2 text-xl font-bold text-red-700">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h1>
            <p className="m-0 text-sm leading-relaxed text-[#77665e]">
              {status.message ?? "ลิงก์ยืนยันใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง"}
              <br />
              ขอลิงก์ใหม่ได้ที่หน้าเข้าสู่ระบบ — ล็อกอินด้วยอีเมลและรหัสผ่าน แล้วกด &quot;ส่งลิงก์ยืนยันอีกครั้ง&quot;
            </p>
            <Link href={LOGIN_PATH} className={button}>กลับหน้าเข้าสู่ระบบ</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
