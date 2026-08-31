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
    startPromise = worker
      .start({
        // request ที่ "ไม่มี handler" → log เตือน (ช่วย debug ว่า URL ไม่ตรง) แล้วปล่อยผ่าน
        onUnhandledRequest: (req, print) => {
          if (new URL(req.url).pathname.startsWith("/_next")) return; // เงียบ asset ของ Next
          print.warning();
        },
      })
      .then((reg) => {
        console.info("[MSW] mock API เปิดอยู่ — ดัก request ตาม src/mocks/handlers/");
        return reg;
      })
      .catch((err) => {
        console.error("[MSW] worker.start() ล้มเหลว — request จะยิงไป backend จริง", err);
      });
  }
  return startPromise;
}
