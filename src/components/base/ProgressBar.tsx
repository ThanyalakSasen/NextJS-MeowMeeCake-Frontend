"use client";
import { Progress } from "antd";
/** แท่ง % เปลี่ยนสีตามค่า (เขียว/เหลือง/แดง) — ส่ง color เองก็ได้
 *  ariaLabel = ชื่อให้ screen reader (antd วาด role="progressbar" แต่ไม่มีชื่อ → Lighthouse "aria-progressbar-name" ตก)
 *  ไม่ส่ง = ใช้ตัวเลข % แทน */
export function ProgressBar({ percent, color, ariaLabel }: { percent: number; color?: string; ariaLabel?: string }) {
  const value = Math.max(0, Math.min(100, percent));
  const c = color ?? (percent >= 60 ? "#22c55e" : percent >= 25 ? "#f59e0b" : "#ef4444");
  return <Progress percent={value} strokeColor={c} showInfo={false} size="small" aria-label={ariaLabel ?? `${value}%`} />;
}
