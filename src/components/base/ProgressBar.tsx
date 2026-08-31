"use client";
import { Progress } from "antd";
/** แท่ง % เปลี่ยนสีตามค่า (เขียว/เหลือง/แดง) — ส่ง color เองก็ได้ */
export function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  const c = color ?? (percent >= 60 ? "#22c55e" : percent >= 25 ? "#f59e0b" : "#ef4444");
  return <Progress percent={Math.max(0, Math.min(100, percent))} strokeColor={c} showInfo={false} size="small" />;
}
