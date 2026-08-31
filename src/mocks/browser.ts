// ─────────────────────────────────────────────────────────────
// src/mocks/browser.ts  — MSW worker (client) — D17
// start ครั้งเดียวก่อนแอป mount (ผ่าน MSWReady) เมื่อ NEXT_PUBLIC_API_MOCK=1
// ─────────────────────────────────────────────────────────────
import { setupWorker } from "msw/browser";
import { handlers } from "@/mocks/handlers";

export const worker = setupWorker(...handlers);

let startPromise: Promise<unknown> | null = null;

export function startMockWorker(): Promise<unknown> {
  if (!startPromise) {
    startPromise = worker.start({
      onUnhandledRequest: "bypass", // request ที่ไม่มี handler → ปล่อยผ่านตามปกติ
      quiet: true,
    });
  }
  return startPromise;
}
