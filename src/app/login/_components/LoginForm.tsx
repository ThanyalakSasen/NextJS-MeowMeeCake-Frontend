"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Input, PasswordInput, Logo } from "@/components/base";
import { login } from "@/lib/authClient";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { CUSTOMER_HOME_PATH, HOME_PATH, PROFILE_PATH } from "@/constants/auth";
import type { RoleType } from "@/types/auth";

const isPath = (next: string, base: string) => next === base || next.startsWith(`${base}/`) || next.startsWith(`${base}?`);

/**
 * ปลายทางหลัง login ตาม role — รับ ?next= เฉพาะ path ภายในแอป (กัน open redirect)
 *  - ลูกค้า: หน้าร้าน (/customer/*) หรือ /profile · อย่างอื่น (รวม /owner) → หน้าแรกของหน้าร้าน
 *  - เจ้าของร้าน/พนักงาน: /owner/* · /profile · /customer/* (ดูหน้าร้านได้) · ไม่มี next → แดชบอร์ด
 */
function nextPathFor(roleType: RoleType | null, next: string | null): string {
  if (roleType === "customer") {
    return next && (isPath(next, CUSTOMER_HOME_PATH) || isPath(next, PROFILE_PATH)) ? next : CUSTOMER_HOME_PATH;
  }
  return next && (isPath(next, "/owner") || isPath(next, PROFILE_PATH) || isPath(next, CUSTOMER_HOME_PATH)) ? next : HOME_PATH;
}

function Form() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      const user = await login({ email: email.trim(), password });
      router.replace(nextPathFor(user.roleType, params.get("next")));
      router.refresh();
    } catch (e2) {
      // แจ้งด้วย swal2 toast เหมือนหน้าอื่นทั้งหมด (เพิ่ม/แก้/ลบ) — เดิมใช้ ErrorMessage แถบแดง inline
      // แยกออกไปคนละแพทเทิร์น (ดู docs/BACKLOG.md §9)
      alert.error(isApiError(e2) ? e2.message : t("auth.loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-3">
      <div className="flex flex-col items-center mb-4">
        <Logo size={72} />
        <p className="mt-3 text-lg font-semibold text-brown-900">{t("auth.loginTitle")}</p>
        <p className="text-xs text-gray-400">{t("auth.loginSubtitle")}</p>
      </div>
      <Input type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <PasswordInput placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      <Button htmlType="submit" type="primary" loading={busy} block>
        {t("auth.submit")}
      </Button>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
