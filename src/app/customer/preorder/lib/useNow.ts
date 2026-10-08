"use client";
// เวลาปัจจุบันสำหรับตัดสิน "รอบยังเปิดรับไหม" ระหว่าง render (Date.now() ใน render ผิดกฎ React Compiler — impure)
import { useEffect, useState } from "react";
import type { StorefrontRound } from "@/services/shopPreorders";

/** เวลาปัจจุบัน (ms) — อัปเดตทุก intervalMs (ค่าเริ่มต้น 1 นาที) */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** รอบเปิดรับอยู่จริง: สถานะ open + ยังไม่เลยเวลาปิด (backend เปลี่ยนสถานะด้วย cron — อาจช้ากว่าเวลาจริง) */
export const isRoundOpen = (r: Pick<StorefrontRound, "round_status" | "close_date">, now: number) =>
  r.round_status === "open" && new Date(r.close_date).getTime() > now;
