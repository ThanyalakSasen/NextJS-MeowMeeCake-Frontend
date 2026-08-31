// ─────────────────────────────────────────────────────────────
// src/lib/authClient.ts
// ทุกอย่างที่ frontend ทำเรื่อง auth — เรียก backend + sync ข้ามแท็บ
// ไม่มีข้อความ UI (component เป็นคน render ข้อความผ่าน t())
// ดู docs/AUTH_PLAN.md
// ─────────────────────────────────────────────────────────────
import type { AxiosRequestConfig } from "axios";
import { http, setUnauthorizedHandler } from "@/lib/http";
import type { CurrentUser, LoginInput } from "@/types/auth";
import type { ItemResponse } from "@/types/api";
import { AUTH_BROADCAST_CHANNEL } from "@/constants/auth";

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
  const res = await http.get<ItemResponse<CurrentUser>>("/auth/me");
  return res.data;
}

export async function login(input: LoginInput): Promise<CurrentUser> {
  await http.post("/auth/login", input); // backend ตั้ง cookie
  return me();
}

export async function logout(opts: { broadcast?: boolean } = {}): Promise<void> {
  try {
    await http.post("/auth/logout");
  } catch {
    // เงียบไว้ — จะ redirect ไป login อยู่แล้ว
  }
  if (opts.broadcast !== false) channel()?.postMessage({ type: "logout" } satisfies AuthBroadcast);
}

// ── refresh แบบ single-flight (หลาย request 401 พร้อมกัน → refresh ครั้งเดียว) ──
let refreshing: Promise<void> | null = null;
export function refresh(): Promise<void> {
  if (!refreshing) {
    refreshing = http
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

/**
 * ต่อ interceptor 401 ของ http.ts เข้ากับ flow refresh
 * onFail = callback ตอน refresh ไม่สำเร็จ (component ใส่: เคลียร์ cache + redirect /login)
 * คืนฟังก์ชันถอด (ใช้ตอน unmount)
 */
export function installAuthInterceptor(onFail: () => void): () => void {
  setUnauthorizedHandler(async (originalConfig: AxiosRequestConfig) => {
    try {
      await refresh();
      return http.raw.request(originalConfig); // ยิง request เดิมซ้ำ
    } catch {
      onFail();
      return Promise.reject({ status: 401, message: "session expired" });
    }
  });
  return () => setUnauthorizedHandler(null);
}
