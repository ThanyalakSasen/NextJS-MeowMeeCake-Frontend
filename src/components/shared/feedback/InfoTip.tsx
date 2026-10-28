"use client";
// ─────────────────────────────────────────────────────────────
// InfoTip — ไอคอน ⓘ เล็ก ๆ ข้างหัวข้อ ชี้/แตะ/โฟกัสแล้วขึ้นคำอธิบาย (ตัวเลขนี้คิดจากอะไร · ควรทำอะไรต่อ)
// เป็นปุ่มจริง (โฟกัสด้วยคีย์บอร์ดได้ + aria-label = ข้อความเดียวกัน) · tooltip สร้างตอนใช้ครั้งแรก (LazyTooltip)
// ─────────────────────────────────────────────────────────────
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { LazyTooltip } from "./LazyTooltip";

export function InfoTip({ text, className = "" }: { text: string; className?: string }) {
  return (
    <LazyTooltip title={text}>
      <button
        type="button"
        aria-label={text}
        onClick={(e) => e.preventDefault()}
        className={`inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full border-none bg-transparent p-0 align-middle text-gray-500 hover:text-brown-700 focus-visible:outline-2 focus-visible:outline-brown-500 ${className}`}
      >
        <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </LazyTooltip>
  );
}
