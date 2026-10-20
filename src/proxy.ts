// ─────────────────────────────────────────────────────────────
// src/proxy.ts   (Next 16 "proxy" = middleware เดิม, รัน Node runtime)
// ด่านหน้าแบบเบา — เช็คแค่ "มี" auth cookie ไหม (ไม่ verify JWT, ไม่แตะ backend) — D18
// การเช็ค can_view ต่อ route ย้ายไปฝั่ง client (usePermission)
// + ตั้ง cookie ภาษาให้ครั้งแรก = ไทยเสมอ (default = th) — ผู้ใช้เปลี่ยนเองผ่าน LocaleSwitcher
// ─────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, AUTH_GATE, LOGIN_PATH, HOME_PATH, PROFILE_PATH, CUSTOMER_HOME_PATH } from "@/constants/auth";
import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/i18n/config";

const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

function ensureLocaleCookie(req: NextRequest, res: NextResponse): NextResponse {
  if (!isLocale(req.cookies.get(LOCALE_COOKIE)?.value)) {
    // ไม่เดาจาก Accept-Language — default ของแอปนี้คือภาษาไทย
    res.cookies.set(LOCALE_COOKIE, defaultLocale, { path: "/", maxAge: LOCALE_MAX_AGE, sameSite: "lax" });
  }
  return res;
}

/**
 * /api/* ที่ส่งต่อไป backend (next.config.ts rewrites → API_PROXY_TARGET) — ลบ header Origin ของคำขอจากหน้าเว็บเราเอง
 *
 * ทำไม: backend ตรวจ CSRF ด้วย Origin เทียบกับ ALLOWED_ORIGINS ของมัน — โดเมนของ frontend ที่ไม่อยู่ในลิสต์ (เช่น
 * http://localhost:3001 ตอน dev ชี้ backend บน Render) โดน 403 CROSS_ORIGIN ทุก POST/PATCH/DELETE (login ไม่ได้)
 * ส่วนคำขอที่ไม่มี Origin (server-to-server) backend ปล่อยผ่าน · แทนค่าเป็นโดเมนอื่นไม่ได้ — backend ปฏิเสธทุก Origin นอกลิสต์
 *
 * ปลอดภัยเพราะ: ลบเฉพาะเมื่อ Origin === origin ของ frontend เอง (เบราว์เซอร์เป็นคนตั้ง Origin สคริปต์ปลอมไม่ได้)
 * คำขอจากเว็บอื่นที่ยิงเข้า /api ของเรายังคง Origin เดิม → backend ปฏิเสธเหมือนเดิม · cookie session ยัง SameSite ตามที่ backend ตั้ง
 */
function stripSameOriginHeader(req: NextRequest): NextResponse {
  const origin = req.headers.get("origin");
  if (!origin || origin !== req.nextUrl.origin) return NextResponse.next();
  const headers = new Headers(req.headers);
  headers.delete("origin");
  return NextResponse.next({ request: { headers } });
}

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    return process.env.API_PROXY_TARGET ? stripSameOriginHeader(req) : NextResponse.next();
  }

  // โหมด "client" (คนละ site กับ backend — ดู constants/auth.ts AUTH_GATE): cookie มองไม่เห็นจากที่นี่ ห้ามเช็ค
  // "/" ไปหน้าแรกเลย (ยังไม่ login → OwnerLayout เด้งไป /login เอง) · /owner/* และ /login ปล่อยผ่าน
  // "/" = หน้าแรกของหน้าร้าน สำหรับทุกคน (guest/ลูกค้า/พนักงาน) — proxy รู้แค่ว่ามี cookie ไม่รู้ role
  // พนักงานเข้าหลังร้านผ่าน /login (พาไป /owner ตาม role) หรือ /owner ตรง ๆ
  // (redirect ใน page.tsx เป็น meta-refresh ตอน streaming — ทำที่นี่ให้เป็น 307)
  if (pathname === "/") {
    return ensureLocaleCookie(req, NextResponse.redirect(new URL(CUSTOMER_HOME_PATH, req.url)));
  }

  if (AUTH_GATE === "client") {
    return ensureLocaleCookie(req, NextResponse.next());
  }

  const hasAuth = !!req.cookies.get(AUTH_COOKIE)?.value;

  if (pathname.startsWith("/owner") || pathname === PROFILE_PATH) {
    if (!hasAuth) {
      const url = new URL(LOGIN_PATH, req.url);
      // เก็บ query ไว้ด้วย — กลับจาก LINE (/profile?line=linked) ตอน session หลุด จะได้ไม่ทิ้งผลลัพธ์
      url.searchParams.set("next", pathname + req.nextUrl.search);
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
  matcher: ["/", "/owner/:path*", "/profile", "/login", "/api/:path*"],
};
