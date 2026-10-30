"use client";
// ─────────────────────────────────────────────────────────────
// ช่องจำนวนที่พิมพ์เองได้ (อยู่ระหว่างปุ่ม − / +) — หน้ารายละเอียดสินค้า · กล่องพรีออเดอร์ · ตะกร้า
// - พิมพ์ได้เฉพาะตัวเลข · ยืนยันเมื่อกด Enter หรือออกจากช่อง (ไม่ยิงทุกตัวอักษร — ตะกร้าบันทึกผ่าน API)
// - เกินช่วง = ปรับเป็น min/max ให้เอง · ลบจนว่างแล้วออก = กลับเป็นค่าเดิม · Esc = ยกเลิกที่พิมพ์
// ─────────────────────────────────────────────────────────────
import { useState } from "react";

export default function QtyInput({
  value,
  min = 1,
  max,
  onCommit,
  disabled = false,
  label,
  className = "",
}: {
  value: number;
  min?: number;
  /** ไม่ส่ง = ไม่จำกัด */
  max?: number;
  /** เรียกเมื่อจำนวนใหม่ต่างจากเดิม (ปรับให้อยู่ในช่วงแล้ว) */
  onCommit: (n: number) => void;
  disabled?: boolean;
  /** ชื่อช่องสำหรับ screen reader เช่น "จำนวน" */
  label: string;
  className?: string;
}) {
  // ข้อความที่กำลังพิมพ์ — null = แสดงค่าจริง (value) · ค่าเปลี่ยนจากปุ่ม +/− ก็เห็นทันที
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const n = Number.parseInt(draft, 10);
    setDraft(null);
    if (!Number.isFinite(n)) return; // ว่าง = กลับเป็นค่าเดิม
    const hi = max != null ? Math.max(min, max) : Number.MAX_SAFE_INTEGER;
    const clamped = Math.min(Math.max(n, min), hi);
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={label}
      disabled={disabled}
      value={draft ?? String(value)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 5))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
      className={`border-0 bg-transparent text-center font-bold tabular-nums text-[#4A342E] outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#8C5A3C]/40 disabled:opacity-60 ${className}`}
    />
  );
}
