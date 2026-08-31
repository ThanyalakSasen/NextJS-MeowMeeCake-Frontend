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
import type { ApiError } from "@/types/api";

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

// ── 401 handler ── (Phase 2: authClient ลงทะเบียน refresh+redirect ที่นี่)
type UnauthorizedHandler = (originalRequest: AxiosRequestConfig) => Promise<unknown>;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  onUnauthorized = fn;
}

// ── response: แปลง error เป็น ApiError ที่ ViewModel ใช้ได้ ──
function toApiError(err: AxiosError<{ message?: string; errors?: Record<string, string> }>): ApiError {
  const status = err.response?.status ?? 0;
  const body = err.response?.data;
  return {
    status,
    message: body?.message ?? (status === 0 ? "network error" : `request failed (${status})`),
    fieldErrors: body?.errors,
    cause: err,
  };
}

client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401 && onUnauthorized && !(err.config as { _retried?: boolean })?._retried) {
      (err.config as { _retried?: boolean })._retried = true;
      return onUnauthorized(err.config ?? {});
    }
    return Promise.reject(toApiError(err as AxiosError<{ message?: string }>));
  },
);

/** facade — คืน body ของ response (envelope { data, meta } / { data }) ตรง ๆ */
export const http = {
  get:    <T>(url: string, config?: AxiosRequestConfig) => client.get<T>(url, config).then((r) => r.data),
  post:   <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => client.post<T>(url, body, config).then((r) => r.data),
  patch:  <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => client.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) => client.delete<T>(url, config).then((r) => r.data),
  /** ใช้ retry request เดิมหลัง refresh สำเร็จ (Phase 2) */
  raw: client,
};
