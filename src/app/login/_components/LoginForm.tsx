"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Input, PasswordInput, Logo, ErrorMessage } from "@/components/base";
import { login } from "@/lib/authClient";
import { isApiError } from "@/types/api";
import { HOME_PATH } from "@/constants/auth";

function Form() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setErr(null);
    try {
      await login({ email: email.trim(), password });
      const next = params.get("next");
      router.replace(next && next.startsWith("/owner") ? next : HOME_PATH);
      router.refresh();
    } catch (e2) {
      setErr(isApiError(e2) ? e2.message : t("auth.loginFailed"));
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
      {err && <ErrorMessage>{err}</ErrorMessage>}
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
