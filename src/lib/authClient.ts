// ─────────────────────────────────────────────────────────────
// src/lib/authClient.ts
// ทุกอย่างที่ frontend ทำเรื่อง auth — เรียก backend + sync ข้ามแท็บ
// ไม่มีข้อความ UI (component เป็นคน render ข้อความผ่าน t())
// ดู docs/AUTH_PLAN.md
// ─────────────────────────────────────────────────────────────
import { http, setUnauthorizedHandler } from "@/lib/http";
import type { CurrentUser, LoginInput, MenuAccess, RawAuthUser, RawMenuPermissions } from "@/types/auth";
import type { ItemResponse } from "@/types/api";
import { AUTH_BROADCAST_CHANNEL } from "@/constants/auth";
import { ALL_MENU_KEYS, FULL_MENU_ACCESS, NO_MENU_ACCESS, isUnrestrictedRole } from "@/constants/menuKeys";

// ── map RawAuthUser (ดิบจาก backend) → CurrentUser (ที่ที่เหลือของแอปใช้) ──
// menuAccess: owner = สิทธิ์เต็มเสมอ · role อื่น = ตาม permissions ที่ backend ส่งมากับ /auth/me
// (backend คำนวณจากตาราง permissions ของ role นั้น รวมเรื่องหมดอายุแล้ว) — ไม่มีข้อมูล = ปิดหมด (fail closed)
// นี่เป็น UX gate เท่านั้น (ซ่อนเมนู/ปุ่ม) ตัวบังคับสิทธิ์จริงคือ backend ทุก route
function buildMenuAccess(roleType: string | undefined, perms?: RawMenuPermissions): MenuAccess {
  const full = isUnrestrictedRole(roleType);
  return Object.fromEntries(
    ALL_MENU_KEYS.map((key) => {
      if (full) return [key, FULL_MENU_ACCESS];
      const p = perms?.[key];
      if (!p) return [key, NO_MENU_ACCESS];
      return [
        key,
        { view: !!p.can_view, create: !!p.can_create, update: !!p.can_update, delete: !!p.can_delete, approve: !!p.can_approve },
      ];
    })
  ) as MenuAccess;
}

function toCurrentUser(raw: RawAuthUser, perms?: RawMenuPermissions): CurrentUser {
  const role = typeof raw.role_id === "string" ? null : raw.role_id;
  return {
    id: raw._id,
    email: raw.email,
    fullname: raw.user_fullname,
    roleId: role?._id ?? (typeof raw.role_id === "string" ? raw.role_id : ""),
    roleName: role?.role_name ?? "",
    roleType: role?.role_type ?? null,
    menuAccess: buildMenuAccess(role?.role_type, perms),
  };
}

// ── BroadcastChannel (sync logout ข้ามแท็บ) ──
let bc: BroadcastChannel | null = null;
function channel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  if (!bc) bc = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
  return bc;
}

export type AuthBroadcast = { type: "logout" };

export function onAuthBroadcast(handler: (msg: AuthBroadcast) => void): () => void {
  const ch = channel();
  if (!ch) return () => {};
  const listener = (e: MessageEvent) => handler(e.data as AuthBroadcast);
  ch.addEventListener("message", listener);
  return () => ch.removeEventListener("message", listener);
}

// ── endpoints ──
export async function me(): Promise<CurrentUser> {
  const res = await http.get<ItemResponse<{ user: RawAuthUser; permissions?: RawMenuPermissions }>>("/auth/me");
  return toCurrentUser(res.data.user, res.data.permissions);
}

/**
 * ผู้ใช้ปัจจุบันแบบ "ไม่บังคับ login" — สำหรับหน้าร้านที่ guest เปิดดูได้
 * ยังไม่ login (401) → null โดยไม่เด้งไปหน้า login (ข้าม 401 handler กลางด้วย skipAuthRedirect)
 */
export async function meOptional(): Promise<CurrentUser | null> {
  try {
    const res = await http.get<ItemResponse<{ user: RawAuthUser; permissions?: RawMenuPermissions }>>("/auth/me", {
      skipAuthRedirect: true,
    });
    return toCurrentUser(res.data.user, res.data.permissions);
  } catch (e) {
    if ((e as { status?: number })?.status === 401) return null;
    throw e;
  }
}

/**
 * POST /auth/register — ลูกค้าสมัครสมาชิกเอง (backend บังคับ role customer)
 * backend ส่งลิงก์ยืนยันทางอีเมล (24 ชม.) และ**ไม่ตั้ง cookie** — ยืนยันก่อนจึงล็อกอินได้
 * (backend docs/customer-backend-merge.md §8.9) · คืน message ของ backend ไว้แสดง "กรุณาตรวจอีเมล"
 */
export async function register(input: { user_fullname: string; email: string; password: string; user_phone?: string }) {
  const res = await http.post<ItemResponse<{ message?: string }>>("/auth/register", input);
  return res.data;
}

/** login แล้วได้ 403 + reason นี้ = ลูกค้ายังไม่ยืนยันอีเมล (เจ้าของร้าน/พนักงานไม่โดน) */
export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";

/**
 * POST /auth/resend-verification { email } — ขอลิงก์ยืนยันอีเมลใหม่
 * backend ตอบข้อความเดียวกันทุกกรณี (กันเดาอีเมล) · จำกัด 3 ครั้ง/นาที ต่อ IP (เกิน = 429)
 */
export async function resendVerification(email: string): Promise<void> {
  await http.post("/auth/resend-verification", { email });
}

export async function login(input: LoginInput): Promise<CurrentUser> {
  await http.post("/auth/login", input); // backend ตั้ง cookie
  return me();
}

/**
 * POST /auth/google { credential } — ID token จาก Google Identity Services (ปุ่ม Google ในหน้า login)
 * backend ตรวจ token กับ GOOGLE_CLIENT_ID แล้วตั้ง cookie `session` (ไม่มีบัญชี = สร้างลูกค้าให้)
 */
export async function loginWithGoogle(credential: string): Promise<CurrentUser> {
  await http.post("/auth/google", { credential });
  return me();
}

/**
 * URL เริ่มเข้าสู่ระบบด้วย LINE — ต้องพาเบราว์เซอร์ไปทั้งหน้า (window.location) ไม่ใช่ fetch
 * backend redirect ไปหน้ายินยอมของ LINE → ตั้ง cookie `session` → กลับมา /login/line (LINE_AUTH_RETURN_URL ของ backend)
 */
export function lineLoginUrl(next: string | null): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/auth/line${next ? `?next=${encodeURIComponent(next)}` : ""}`;
}

export async function logout(opts: { broadcast?: boolean } = {}): Promise<void> {
  try {
    await http.post("/auth/logout");
  } catch {
    // เงียบไว้ — จะ redirect ไป login อยู่แล้ว
  }
  if (opts.broadcast !== false) channel()?.postMessage({ type: "logout" } satisfies AuthBroadcast);
}

/**
 * ต่อ interceptor 401 ของ http.ts — backend ไม่มี refresh token (JWT อายุ 7 วัน) ดังนั้น 401 = session
 * หมดอายุจริง → เรียก onFail ทันที (component ใส่: เคลียร์ cache + redirect /login)
 * หลาย request 401 พร้อมกัน (เช่น dashboard ยิงหลาย endpoint) → onFail แค่ครั้งเดียวต่อช่วงสั้น ๆ
 * คืนฟังก์ชันถอด (ใช้ตอน unmount)
 */
const FAIL_DEDUPE_MS = 2_000;

export function installAuthInterceptor(onFail: () => void): () => void {
  let lastFired = 0;
  setUnauthorizedHandler(() => {
    const now = Date.now();
    if (now - lastFired < FAIL_DEDUPE_MS) return;
    lastFired = now;
    onFail();
  });
  return () => setUnauthorizedHandler(null);
}
