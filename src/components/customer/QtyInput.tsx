"use client";
// ─────────────────────────────────────────────────────────────
// ช่องจำนวนสินค้าที่พิมพ์ตัวเลขเองได้ (อยู่ระหว่างปุ่ม − / +) — หน้ารายละเอียดสินค้า · พรีออเดอร์ · ตะกร้า (2026-10-29)
// พิมพ์ได้เฉพาะตัวเลข · ยืนยันตอนออกจากช่อง / กด Enter (ไม่ยิงทุกตัวอักษร — ตะกร้าเรียก API)
// ค่าเกินขอบ = ปรับเป็น min/max ให้ · ว่าง/0 = กลับเป็นค่าเดิม · Esc = ยกเลิกที่พิมพ์
// ─────────────────────────────────────────────────────────────
import { useRef, useState } from "react";

export default function QtyInput({
  value,
  min = 1,
  max,
  onCommit,
  disabled = false,
  ariaLabel,
  className,
}: {
  value: number;
  min?: number;
  /** null/undefined = ไม่จำกัด */
  max?: number | null;
  onCommit: (n: number) => void;
  disabled?: boolean;
  ariaLabel: string;
  className: string;
}) {
  // draft = กำลังพิมพ์ (null = แสดงค่าจริง)
  const [draft, setDraft] = useState<string | null>(null);
  // กด Esc แล้ว blur ตามมาในจังหวะเดียวกัน — ธงนี้กันไม่ให้ blur ยืนยันค่าที่ยกเลิกไปแล้ว
  const cancelled = useRef(false);

  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      setDraft(null);
      return;
    }
    if (draft === null) return;
    const n = Number.parseInt(draft, 10);
    setDraft(null);
    if (!Number.isFinite(n) || n <= 0) return;
    const clamped = Math.max(min, max != null ? Math.min(n, Math.max(min, max)) : n);
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={ariaLabel}
      disabled={disabled}
      value={draft ?? String(value)}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      className={`border-0 bg-transparent p-0 text-center outline-none focus:ring-2 focus:ring-[#8C5A3C]/30 disabled:opacity-60 ${className}`}
    />
  );
}
