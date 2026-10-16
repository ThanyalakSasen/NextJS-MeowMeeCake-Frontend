// ─────────────────────────────────────────────────────────────
// serverAuth — ผู้ใช้ปัจจุบันฝั่ง server (layout หลังร้าน) จาก cookie login ที่ browser ส่งมา
//
// ทำไม: เดิม HTML หลังร้านเป็นแค่วงหมุน → browser รัน JS → ถาม /auth/me → ค่อยวาดหน้า + ยิง API ของหน้า
// (รอ backend 2 ทอดต่อกัน · Lighthouse LCP หน้ารายงานยอดขาย 4.3 วิ) · ตอนนี้ server ถามให้ตั้งแต่ render
// → HTML แรกมีโครงหน้าครบ และหน้าเริ่มดึงข้อมูลทันทีที่ hydrate
//
// cookie login เป็นของโดเมน frontend (ส่งต่อ /api ผ่าน rewrites — next.config.ts) server จึงอ่านแล้วส่งต่อได้
// ไม่แคชเด็ดขาด (no-store — ข้อมูลรายคน) · ไม่มี cookie / backend ช้าเกิน 2.5 วิ / error → null = ให้ browser ถามเองเหมือนเดิม
// ─────────────────────────────────────────────────────────────
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/constants/auth";
import { LOCALE_COOKIE, defaultLocale } from "@/i18n/config";
import { serverBaseURL } from "@/lib/http";
import { toCurrentUser } from "@/lib/authClient";
import type { CurrentUser, RawAuthUser, RawMenuPermissions } from "@/types/auth";

const TIMEOUT_MS = 2500;

export async function currentUserOnServer(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const base = serverBaseURL();
  if (!base || !jar.get(AUTH_COOKIE)) return null;
  try {
    const res = await fetch(`${base}/auth/me`, {
      headers: {
        cookie: jar.toString(),
        "accept-language": jar.get(LOCALE_COOKIE)?.value ?? defaultLocale,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { user?: RawAuthUser; permissions?: RawMenuPermissions } };
    return body.data?.user ? toCurrentUser(body.data.user, body.data.permissions) : null;
  } catch {
    return null;
  }
}
