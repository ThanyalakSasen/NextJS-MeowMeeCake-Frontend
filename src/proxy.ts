// ─────────────────────────────────────────────────────────────
// src/proxy.ts   (Next 16 "proxy" = middleware เดิม, รัน Node runtime)
// ด่านหน้าแบบเบา — เช็คแค่ "มี" auth cookie ไหม (ไม่ verify JWT, ไม่แตะ backend) — D18
// การเช็ค can_view ต่อ route ย้ายไปฝั่ง client (usePermission)
// + ตั้ง cookie ภาษาให้ครั้งแรก = ไทยเสมอ (default = th) — ผู้ใช้เปลี่ยนเองผ่าน LocaleSwitcher
// ─────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, LOGIN_PATH, HOME_PATH } from "@/constants/auth";
import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/i18n/config";

const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

function ensureLocaleCookie(req: NextRequest, res: NextResponse): NextResponse {
  if (!isLocale(req.cookies.get(LOCALE_COOKIE)?.value)) {
    // ไม่เดาจาก Accept-Language — default ของแอปนี้คือภาษาไทย
    res.cookies.set(LOCALE_COOKIE, defaultLocale, { path: "/", maxAge: LOCALE_MAX_AGE, sameSite: "lax" });
  }
  return res;
}

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const hasAuth = !!req.cookies.get(AUTH_COOKIE)?.value;

  // "/" → เด้งตามสถานะ login (redirect ใน page.tsx เป็น meta-refresh ตอน streaming — ทำที่นี่ให้เป็น 307)
  if (pathname === "/") {
    return ensureLocaleCookie(req, NextResponse.redirect(new URL(hasAuth ? HOME_PATH : LOGIN_PATH, req.url)));
  }

  if (pathname.startsWith("/owner")) {
    if (!hasAuth) {
      const url = new URL(LOGIN_PATH, req.url);
      url.searchParams.set("next", pathname);
      return ensureLocaleCookie(req, NextResponse.redirect(url));
    }
    return ensureLocaleCookie(req, NextResponse.next());
  }

  // login อยู่แล้ว แต่เปิด /login ซ้ำ → ไปหน้าแรก
  if (pathname === LOGIN_PATH && hasAuth) {
    return ensureLocaleCookie(req, NextResponse.redirect(new URL(HOME_PATH, req.url)));
  }

  return ensureLocaleCookie(req, NextResponse.next());
}

export const config = {
  matcher: ["/", "/owner/:path*", "/login"],
};
