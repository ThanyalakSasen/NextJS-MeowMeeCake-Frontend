"use client";

// หน้า login — เวอร์ชัน interim (เฟส 2) เพื่อทดสอบ auth flow
// เฟส 4 จะแทนที่ด้วย Screen #1 เต็ม (LoginForm + Logo + base/ components)
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Input } from "antd";
import { login } from "@/lib/authClient";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { HOME_PATH } from "@/constants/auth";

function LoginForm() {
  const t = useTranslations("auth");
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
      await login({ email: email.trim(), password });
      await alert.success(t("loginSuccess"));
      const next = params.get("next");
      router.replace(next && next.startsWith("/owner") ? next : HOME_PATH);
      router.refresh();
    } catch (err) {
      alert.error(isApiError(err) ? err.message : t("loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-3">
      <div className="mb-2">
        <h1 className="text-xl font-medium text-brown-900">{t("loginTitle")}</h1>
        <p className="text-xs text-gray-400">{t("loginSubtitle")}</p>
      </div>
      <Input
        type="email"
        placeholder={t("email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <Input.Password
        placeholder={t("password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      <Button htmlType="submit" type="primary" loading={busy} block>
        {t("submit")}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
