"use client";
// ─────────────────────────────────────────────────────────────
// /login/line — backend พากลับมาที่นี่หลังเข้าสู่ระบบด้วย LINE (LINE_AUTH_RETURN_URL · backend src/app/api/auth/line/callback)
//   ?line=success[&next=/path] → cookie `session` ตั้งแล้ว → โหลดผู้ใช้ → ไปหน้าตาม role (nextPathFor)
//   ?line=cancelled            → กลับ /login (ผู้ใช้กดไม่ยินยอมในหน้า LINE)
//   ?error=<ข้อความ>           → กลับ /login พร้อมแจ้ง error ของ backend
// แยกจาก /login เพราะ proxy.ts เด้ง /login ที่มี cookie แล้วไปแดชบอร์ดทันที (ลูกค้าจะไปผิดหน้า)
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { me } from "@/lib/authClient";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { LOGIN_PATH } from "@/constants/auth";
import { nextPathFor } from "../nextPath";

function LineReturn() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const result = params.get("line");
    const error = params.get("error");
    if (result !== "success") {
      if (error) alert.error(error);
      else if (result === "cancelled") alert.info(t("auth.lineCancelled"));
      router.replace(LOGIN_PATH);
      return;
    }
    me()
      .then((user) => {
        router.replace(nextPathFor(user.roleType, params.get("next")));
        router.refresh();
      })
      .catch((e) => {
        alert.error(isApiError(e) ? e.message : t("auth.socialLoginFailed"));
        router.replace(LOGIN_PATH);
      });
    // ทำครั้งเดียวตอนเข้าหน้า
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcf9f6]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#06C755]/20 border-t-[#06C755]" aria-label={t("auth.loginWithLine")} />
    </div>
  );
}

export default function LoginLinePage() {
  return (
    <Suspense fallback={null}>
      <LineReturn />
    </Suspense>
  );
}
