"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ /register — ลูกค้าสมัครสมาชิกเอง (BACKLOG3-merge B1 · ยกจาก FrontOffice src/app/register/page.jsx)
// POST /auth/register → backend สร้างบัญชี "ยังไม่ยืนยัน" + ส่งลิงก์ยืนยันทางอีเมล (24 ชม.) · **ไม่ล็อกอินให้**
// สำเร็จ = แสดง "ตรวจอีเมล" + ปุ่มส่งลิงก์อีกครั้ง (ลิงก์ในอีเมลชี้มาที่ /customer/verify-email)
// กติกาตรวจตรงกับ backend schemas/auth.ts registerBody (ชื่อ ≤ 120 · รหัส 8–72 · เบอร์ 0 + 8–9 หลัก)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { register, resendVerification } from "@/lib/authClient";
import { catalogService } from "@/services/catalog";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{8,9}$/;
const MAX_PASSWORD = 72; // bcrypt ตัดส่วนเกิน — backend ปฏิเสธ
const MAX_NAME = 120;

export interface RegisterForm {
  fullname: string;
  email: string;
  password: string;
  /** "1"–"31" */
  birthDay: string;
  /** "01"–"12" */
  birthMonth: string;
  /** ค.ศ. 4 หลัก */
  birthYear: string;
  phone: string;
  hasAllergy: boolean;
  allergies: string[];
}

const EMPTY: RegisterForm = {
  fullname: "", email: "", password: "", birthDay: "", birthMonth: "", birthYear: "", phone: "", hasAllergy: false, allergies: [],
};

/** วันเกิดเป็น YYYY-MM-DD ถ้ากรอกครบและเป็นวันที่จริงที่ไม่อยู่ในอนาคต · ไม่งั้น null */
function birthdateOf(f: RegisterForm): string | null {
  const y = Number(f.birthYear);
  const m = Number(f.birthMonth);
  const d = Number(f.birthDay);
  if (!y || !m || !d || f.birthYear.length !== 4) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null; // 31 ก.พ. ฯลฯ
  if (date.getTime() > Date.now() || y < 1900) return null;
  return `${f.birthYear}-${f.birthMonth}-${String(d).padStart(2, "0")}`;
}

export function useRegisterViewModel() {
  const t = useTranslations();
  const [form, setForm] = useState<RegisterForm>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  /** สมัครสำเร็จแล้ว — อีเมลที่ส่งลิงก์ยืนยันไป */
  const [doneEmail, setDoneEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const ingredientsQ = useQuery({ queryKey: ["catalog", "ingredients"], queryFn: catalogService.ingredients, staleTime: 10 * 60_000 });
  const allergyOptions = (ingredientsQ.data ?? []).map((i) => i.ingredient_name).filter((n) => !form.allergies.includes(n));

  const set = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  /** ข้อความเตือนข้อแรกที่ไม่ผ่าน · null = ส่งได้ */
  function problem(f: RegisterForm): string | null {
    const name = f.fullname.trim();
    if (!name || !f.email.trim() || !f.password || !f.phone.trim() || !f.birthDay || !f.birthMonth || !f.birthYear) {
      return t("register.errRequired");
    }
    if (name.length < 2 || name.length > MAX_NAME) return t("register.errName", { max: MAX_NAME });
    if (!EMAIL_RE.test(f.email.trim())) return t("register.errEmail");
    if (!birthdateOf(f)) return t("register.errBirthdate");
    if (!PHONE_RE.test(f.phone.trim())) return t("register.errPhone");
    if (f.password.length < MIN_PASSWORD_LENGTH || f.password.length > MAX_PASSWORD) {
      return t("register.errPassword", { min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD });
    }
    if (f.hasAllergy && f.allergies.length === 0) return t("register.errAllergy");
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = problem(form);
    if (p) {
      alert.warning(p);
      return;
    }
    setBusy(true);
    try {
      const email = form.email.trim().toLowerCase();
      await register({
        user_fullname: form.fullname.trim(),
        email,
        password: form.password,
        user_phone: form.phone.trim(),
        user_birthdate: birthdateOf(form) ?? undefined,
        user_allergies: form.hasAllergy ? form.allergies : [],
      });
      setDoneEmail(email);
    } catch (err) {
      // อีเมลซ้ำ / ส่งอีเมลไม่ได้ (502) / ถี่เกิน (429) — ข้อความของ backend เป็นภาษาไทยพร้อมแสดง
      alert.error(isApiError(err) ? err.message : t("register.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!doneEmail) return;
    setResending(true);
    try {
      await resendVerification(doneEmail);
      alert.success(t("auth.resendVerificationSent"));
    } catch (err) {
      alert.error(isApiError(err) ? err.message : t("auth.resendVerificationFailed"));
    } finally {
      setResending(false);
    }
  }

  return {
    form,
    set,
    showPassword,
    toggleShowPassword: () => setShowPassword((v) => !v),
    allergyOptions,
    addAllergy: (name: string) => {
      if (name && !form.allergies.includes(name)) set("allergies", [...form.allergies, name]);
    },
    removeAllergy: (name: string) => set("allergies", form.allergies.filter((a) => a !== name)),
    clearAllergies: () => set("allergies", []),
    busy,
    submit,
    doneEmail,
    resending,
    resend,
  };
}
