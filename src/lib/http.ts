// ─────────────────────────────────────────────────────────────
// src/lib/http.ts
// จุดเดียวที่คุยกับ network — axios instance + interceptor
// ทุก service (src/services/*) เรียกผ่านตัวนี้ · ห้าม component/ViewModel เรียก axios ตรง
// ดู docs/API_CONTRACT.md §6
//
// D15 (auth transport): ตอนนี้ใช้ cookie + withCredentials (ถ้าเปลี่ยนเป็น bearer token
//   ให้เพิ่ม header ใน request interceptor ที่เดียว — ไม่ต้องแตะ service)
// ─────────────────────────────────────────────────────────────
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { readCookie } from "@/lib/cookies";
import { LOCALE_COOKIE, defaultLocale } from "@/i18n/config";
import type { ApiError, BackendErrorBody, ListResponse, RawListResponse } from "@/types/api";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!baseURL && typeof window !== "undefined") {
  console.warn("[http] NEXT_PUBLIC_API_BASE_URL is not set - requests will not resolve (set it in .env.local)");
}

const client = axios.create({
  baseURL,
  withCredentials: true, // ส่ง auth cookie ไปกับทุก request (D15)
  timeout: 15_000,
});

// ── request: แนบภาษาปัจจุบัน ──
client.interceptors.request.use((config) => {
  config.headers.set("Accept-Language", readCookie(LOCALE_COOKIE) ?? defaultLocale);
  return config;
});

// ── 401 handler ── authClient ลงทะเบียนที่นี่ (ล้าง cache + redirect ไป login)
// backend ไม่มี refresh token (JWT อายุ 7 วัน) → 401 = session หมดอายุจริง ไม่มีการ refresh/retry
// interceptor แค่แจ้ง handler แล้วยังโยน ApiError ของ backend กลับให้ผู้เรียกตามปกติ
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  onUnauthorized = fn;
}

/**
 * error.details.issues[] (backend src/lib/validate.ts toIssues()) → { path: message }
 * ที่ ViewModel/ฟอร์มใช้แปะใต้ input ได้ตรง ๆ — DUPLICATE_KEY ฯลฯ ที่ details ไม่ใช่ { issues } ก็คืน undefined
 */
function toFieldErrors(details: BackendErrorBody["error"]["details"]): Record<string, string> | undefined {
  const issues = (details as { issues?: { path: string; message: string }[] } | null)?.issues;
  if (!Array.isArray(issues) || issues.length === 0) return undefined;
  return Object.fromEntries(issues.map((i) => [i.path, i.message]));
}

// ── response: แปลง error เป็น ApiError ที่ ViewModel ใช้ได้ ──
// unwrap ตรงตาม envelope จริงของ backend: { success:false, error:{ code, message, details } }
// (backend src/lib/apiResponse.ts toErrorResponse() / src/middleware.ts deny()) — ดู src/types/api.ts
function toApiError(err: AxiosError<BackendErrorBody>): ApiError {
  const status = err.response?.status ?? 0;
  const body = err.response?.data;
  const backendError = body?.success === false ? body.error : undefined;
  return {
    status,
    code: backendError?.code,
    message: backendError?.message ?? (status === 0 ? "network error" : `request failed (${status})`),
    fieldErrors: toFieldErrors(backendError?.details ?? null),
    cause: err,
  };
}

/**
 * endpoint ที่ 401 = "คำตอบของมันเอง" ไม่ใช่ "session หมดอายุ" → ห้ามเด้งไป login
 *  - /auth/login: 401 คือรหัสผ่านผิด ต้องส่ง error ของ backend ("อีเมลหรือรหัสผ่านไม่ถูกต้อง") กลับให้ฟอร์มแสดงตรง ๆ
 *    (ถ้าปล่อยเข้า handler จะเด้ง /login?reason=expired + ล้าง cache ทุกครั้งที่พิมพ์รหัสผิด)
 *  - /auth/logout, /auth/register, /auth/google: ไม่มี session ให้หมดอายุตั้งแต่แรก
 * (/auth/me ไม่อยู่ในลิสต์นี้ — 401 ตรงนั้นคือ session หมดอายุจริง ให้เด้งไป login)
 */
const NO_EXPIRY_REDIRECT_PATHS = ["/auth/login", "/auth/logout", "/auth/register", "/auth/google"];

function skipsUnauthorizedHandler(config: AxiosRequestConfig | undefined): boolean {
  const url = config?.url ?? "";
  // config.url อาจเป็น relative ("/auth/login") หรือเต็ม (baseURL + path) — ตัด query แล้วเทียบท้าย path
  const path = url.split("?")[0].replace(/\/+$/, "");
  return NO_EXPIRY_REDIRECT_PATHS.some((p) => path === p || path.endsWith(p));
}

client.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && onUnauthorized && !skipsUnauthorizedHandler(err.config)) {
      onUnauthorized();
    }
    return Promise.reject(toApiError(err as AxiosError<BackendErrorBody>));
  },
);

/**
 * list endpoint จริงของ backend ห่อ { items, meta } ไว้ใน data (src/lib/crudRoutes.ts → okList)
 * ไม่ใช่ data: T[] ตรง ๆ — ฟังก์ชันนี้แกะให้เป็น ListResponse<T> ที่ ViewModel ทั้งแอปใช้อยู่แล้ว
 * (`.data` = array, `.meta` = อยู่ระดับบนสุด) ทุก service ต้องเรียกอันนี้แทน http.get สำหรับ .list()
 */
async function getList<T>(url: string, config?: AxiosRequestConfig): Promise<ListResponse<T>> {
  const body = await client.get<RawListResponse<T>>(url, config).then((r) => r.data);
  const items = body?.data?.items ?? [];
  return {
    data: items,
    meta: body?.data?.meta ?? { page: 1, limit: items.length, total: items.length },
  };
}

/** facade — คืน body ของ response (envelope { data, meta } / { data }) ตรง ๆ */
export const http = {
  get:    <T>(url: string, config?: AxiosRequestConfig) => client.get<T>(url, config).then((r) => r.data),
  getList,
  post:   <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => client.post<T>(url, body, config).then((r) => r.data),
  patch:  <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => client.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) => client.delete<T>(url, config).then((r) => r.data),
  /** axios instance ตรง ๆ — สำหรับกรณีพิเศษที่ facade ไม่พอ (ตอนนี้ยังไม่มีผู้ใช้) */
  raw: client,
};
