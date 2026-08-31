// ─────────────────────────────────────────────────────────────
// src/mocks/server.ts  — MSW server (Node) — สำหรับ unit/integration test
// ยังไม่ถูกใช้ที่ไหน (ไม่มี test setup) — เก็บไว้ให้พร้อมเฟสทดสอบ
// ─────────────────────────────────────────────────────────────
import { setupServer } from "msw/node";
import { handlers } from "@/mocks/handlers";

export const server = setupServer(...handlers);
