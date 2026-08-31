// ─────────────────────────────────────────────────────────────
// src/mocks/handlers/auth.ts  — /auth/* (docs/API_CONTRACT.md §2)
// login สำเร็จ → ตั้ง cookie mmc_session ผ่าน document.cookie (ให้ proxy.ts ฝั่ง Node อ่านเจอ)
// ─────────────────────────────────────────────────────────────
import { http, HttpResponse } from "msw";
import { DEV_CREDENTIALS, MOCK_USER, MOCK_AUTH_COOKIE } from "@/mocks/fixtures/auth";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const EIGHT_HOURS = 8 * 60 * 60;

function setAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = `${MOCK_AUTH_COOKIE}=mock-session; path=/; max-age=${EIGHT_HOURS}; samesite=lax`;
  }
}
function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = `${MOCK_AUTH_COOKIE}=; path=/; max-age=0`;
  }
}

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as { email?: string; password?: string };
    if (email !== DEV_CREDENTIALS.email || password !== DEV_CREDENTIALS.password) {
      return HttpResponse.json({ message: "invalid email or password" }, { status: 401 });
    }
    setAuthCookie();
    return HttpResponse.json({
      data: { id: MOCK_USER.id, email: MOCK_USER.email, fullname: MOCK_USER.fullname, roleId: MOCK_USER.roleId },
    });
  }),

  http.post(`${API}/auth/logout`, () => {
    clearAuthCookie();
    return HttpResponse.json({ data: null });
  }),

  http.get(`${API}/auth/me`, () => {
    // ในโหมด mock ถือว่า login อยู่ตราบใดที่ cookie ยังอยู่
    const loggedIn =
      typeof document === "undefined" || document.cookie.includes(`${MOCK_AUTH_COOKIE}=`);
    return loggedIn
      ? HttpResponse.json({ data: MOCK_USER })
      : HttpResponse.json({ message: "unauthorized" }, { status: 401 });
  }),

  http.post(`${API}/auth/refresh`, () => {
    setAuthCookie();
    return HttpResponse.json({ data: null });
  }),
];
