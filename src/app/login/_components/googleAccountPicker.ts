// ─────────────────────────────────────────────────────────────
// เปิดหน้าต่าง "เลือกบัญชี Google" แล้วคืนอีเมลของบัญชีที่เลือก — ใช้กับลิงก์ "ลืมรหัสผ่าน?" ในหน้า login
// Google Identity Services: oauth2.initTokenClient (popup · prompt=select_account) → access token (scope email)
// → GET https://www.googleapis.com/oauth2/v3/userinfo → email
// ไม่ได้ใช้ล็อกอิน — แค่รู้ว่าจะส่งลิงก์ตั้งรหัสใหม่ไปอีเมลไหน (backend ส่งลิงก์ไปที่อีเมลนั้นเอง ผู้ใช้ต้องเปิดอีเมลถึงจะใช้ได้)
// ต้องตั้ง NEXT_PUBLIC_GOOGLE_CLIENT_ID + origin ใน Google Cloud Console (เหมือนปุ่ม Google · GoogleLoginButton.tsx)
// ─────────────────────────────────────────────────────────────
const RAW_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();
/** ค่าตัวอย่างใน .env.example (xxxxxxxx.apps…) ถือว่ายังไม่ได้ตั้ง — ไม่งั้นหน้าต่าง Google พังเงียบ ๆ แล้ว "ลืมรหัสผ่าน" ไม่มีอะไรเกิดขึ้น */
export const GOOGLE_CLIENT_ID = /^x+\./i.test(RAW_CLIENT_ID) ? "" : RAW_CLIENT_ID;
const GIS_SRC = "https://accounts.google.com/gsi/client";

interface TokenResponse {
  access_token?: string;
  error?: string;
}
export interface GoogleOAuth2 {
  initTokenClient(opts: {
    client_id: string;
    scope: string;
    prompt?: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: { type?: string }) => void;
  }): { requestAccessToken(): void };
}

/** โหลดสคริปต์ GIS ครั้งเดียว (ใช้ไฟล์เดียวกับปุ่ม Google — มีอยู่แล้วก็ไม่โหลดซ้ำ) */
let gisLoading: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisLoading ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const el = existing ?? Object.assign(document.createElement("script"), { src: GIS_SRC, async: true });
    el.addEventListener("load", () => resolve(), { once: true });
    el.addEventListener("error", () => reject(new Error("gis load failed")), { once: true });
    if (!existing) document.head.appendChild(el);
    // สคริปต์ที่มีอยู่แล้วอาจโหลดเสร็จไปก่อนผูก listener
    else if (window.google?.accounts?.oauth2) resolve();
  }).catch((e) => {
    gisLoading = null;
    throw e;
  });
  return gisLoading;
}

/**
 * โหลดสคริปต์ไว้ก่อนผู้ใช้กด (เรียกเมื่อเริ่มใช้งานหน้า / ชี้ลิงก์) — ไม่เรียกตอนเปิดหน้า (เหตุผลเดียวกับ #91)
 * กดทันทีก่อนโหลดเสร็จก็ยังเปิดได้ — pickGoogleEmail รอโหลดแล้วเปิด popup ภายในช่วง user activation ของการคลิก
 */
export function preloadGoogleAccountPicker(): void {
  if (GOOGLE_CLIENT_ID) void loadGis().catch(() => {});
}

/**
 * เปิดหน้าต่างเลือกบัญชี Google — ต้องเรียกจาก event คลิกของผู้ใช้ (เบราว์เซอร์จะไม่บล็อก popup)
 * คืนอีเมลที่ Google ยืนยันแล้ว · ผู้ใช้ปิดหน้าต่าง/ยกเลิก = null · ผิดพลาดอื่น = throw
 */
export async function pickGoogleEmail(): Promise<string | null> {
  await loadGis();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("gis unavailable");

  const token = await new Promise<string | null>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email",
      prompt: "select_account",
      callback: (r) => (r.access_token ? resolve(r.access_token) : r.error === "access_denied" ? resolve(null) : reject(new Error(r.error))),
      // ปิดหน้าต่างเอง (popup_closed) = ยกเลิก ไม่ใช่ข้อผิดพลาด
      error_callback: (e) => (e.type === "popup_closed" ? resolve(null) : reject(new Error(e.type ?? "gis error"))),
    });
    client.requestAccessToken();
  });
  if (!token) return null;

  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`userinfo ${res.status}`);
  const info = (await res.json()) as { email?: string; email_verified?: boolean };
  return info.email && info.email_verified !== false ? info.email : null;
}
