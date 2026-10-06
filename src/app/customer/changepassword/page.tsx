"use client";
// ─────────────────────────────────────────────────────────────
// /customer/changepassword — เปลี่ยนรหัสผ่าน (เมนูในบัญชีของฉัน · BACKLOG3-merge B2)
// FrontOffice ทำผ่านลิงก์ทางอีเมลเท่านั้น (backend เดิมไม่มี API) — backend หลักมี PATCH /shop/me/password
// จึงเปลี่ยนได้ทันทีด้วยรหัสเดิม · ลืมรหัสเดิม = ลิงก์ไป /customer/forgot-password (ส่งลิงก์ทางอีเมลแบบต้นแบบ)
// บัญชีที่สมัครด้วย Google / LINE ไม่มีรหัสผ่าน → แสดงคำอธิบายแทนฟอร์ม (ข้อความ/กรอบแบบ FrontOffice)
// เปลี่ยนสำเร็จ: เครื่องอื่นหลุด · เครื่องนี้ backend ออก cookie ใหม่ให้ใช้ต่อ
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { shopProfileService } from "@/services/shopProfile";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import { shopButtonPrimary, shopInput, shopPage } from "@/components/customer/shopStyles";
import { shopProfileKey } from "../lib/shopQueries";

const MAX_PASSWORD = 72;
const card = "mx-auto flex w-full max-w-[580px] flex-col rounded-2xl border border-stone-100 bg-white p-8 shadow-sm sm:p-10";

export default function ChangePasswordPage() {
  return (
    <CustomerAuthGate message="กรุณาเข้าสู่ระบบเพื่อเปลี่ยนรหัสผ่าน">
      <ChangePasswordContent />
    </CustomerAuthGate>
  );
}

function PasswordInput({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block space-y-1 text-sm">
      <span className="block font-semibold text-stone-700">{label}</span>
      <span className="relative flex items-center">
        <input type={show ? "text" : "password"} autoComplete={autoComplete} maxLength={MAX_PASSWORD} value={value}
          onChange={(e) => onChange(e.target.value)} className={`${shopInput} pr-11`} />
        <button type="button" aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShow((v) => !v)}
          className="absolute right-3 text-[#8C5A3C] opacity-70 transition hover:opacity-100">
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
    </label>
  );
}

function ChangePasswordContent() {
  const profileQ = useQuery({ queryKey: shopProfileKey, queryFn: shopProfileService.get });
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  const change = useMutation({
    mutationFn: () => shopProfileService.changePassword(current, next),
    onSuccess: () => {
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    // รหัสเดิมผิด / ถี่เกิน — ข้อความของ backend
    onError: (e) => alert.error(isApiError(e) ? e.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"),
  });

  const problem =
    next && (next.length < MIN_PASSWORD_LENGTH || next.length > MAX_PASSWORD)
      ? `รหัสผ่านใหม่ต้องมี ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD} ตัวอักษร`
      : confirm && next !== confirm
        ? "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน"
        : next && next === current
          ? "รหัสผ่านใหม่ต้องไม่ซ้ำรหัสผ่านเดิม"
          : null;
  const canSubmit = !!current && !!next && !!confirm && !problem && !change.isPending;
  const provider = profileQ.data?.auth_provider;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: "บัญชีของฉัน", href: "/customer/account" }, { label: "เปลี่ยนรหัสผ่าน" }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <h1 className="m-0 text-xl font-bold text-stone-900 sm:text-2xl">เปลี่ยนรหัสผ่าน</h1>

            {profileQ.isLoading ? (
              <div className="h-10 w-10 animate-spin self-center rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label="กำลังโหลด" />
            ) : provider && provider !== "local" ? (
              <div className={`${card} items-center border-t-4 border-t-amber-500 text-center`}>
                <Lock className="mb-4 h-12 w-12 text-[#8C5A3C]" />
                <h2 className="mb-3 text-lg font-bold text-stone-900">ไม่สามารถเปลี่ยนรหัสผ่านได้</h2>
                <p className="m-0 text-sm leading-relaxed text-stone-500">
                  บัญชีของคุณสมัครด้วย{" "}
                  <strong className={provider === "google" ? "text-[#4285F4]" : "text-[#06C755]"}>
                    {provider === "google" ? "Google" : "LINE"}
                  </strong>{" "}
                  จึงไม่มีรหัสผ่าน — เข้าสู่ระบบด้วยปุ่ม {provider === "google" ? "Google" : "LINE"} ในหน้าเข้าสู่ระบบ
                </p>
              </div>
            ) : done ? (
              <div className={`${card} items-center text-center`}>
                <CheckCircle2 className="mb-3 h-12 w-12 text-green-600" />
                <h2 className="mb-2 text-lg font-bold text-green-700">เปลี่ยนรหัสผ่านสำเร็จ</h2>
                <p className="m-0 text-sm leading-relaxed text-stone-500">
                  ใช้รหัสผ่านใหม่ครั้งถัดไปที่เข้าสู่ระบบ · อุปกรณ์อื่นที่ล็อกอินค้างไว้จะต้องเข้าสู่ระบบใหม่
                </p>
                <Link href="/customer/account" className="mt-6 text-sm font-semibold text-[#4A342E] hover:underline">
                  กลับไปบัญชีของฉัน
                </Link>
              </div>
            ) : (
              <form
                className={`${card} gap-4`}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canSubmit) change.mutate();
                }}
              >
                <PasswordInput label="รหัสผ่านปัจจุบัน" value={current} onChange={setCurrent} autoComplete="current-password" />
                <PasswordInput label="รหัสผ่านใหม่" value={next} onChange={setNext} autoComplete="new-password" />
                <PasswordInput label="ยืนยันรหัสผ่านใหม่" value={confirm} onChange={setConfirm} autoComplete="new-password" />
                {problem && <p className="m-0 text-xs text-red-600">{problem}</p>}
                <button type="submit" className={`${shopButtonPrimary} mt-2 w-full`} disabled={!canSubmit}>
                  {change.isPending ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                </button>
                <Link href="/customer/forgot-password" className="self-center text-sm font-semibold text-[#4A342E] hover:underline">
                  ลืมรหัสผ่านปัจจุบัน? ส่งลิงก์ตั้งรหัสใหม่ทางอีเมล
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
