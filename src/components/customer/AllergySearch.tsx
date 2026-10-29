"use client";
// ─────────────────────────────────────────────────────────────
// ช่องค้นหาวัตถุดิบที่แพ้ + รายการที่ตรง (สูงสุด 8) — ใช้ทั้งหน้าบัญชี (อาหารที่แพ้) และหน้าสมัครสมาชิก
// พิมพ์แล้วกดเลือกจากรายการ · Enter = เพิ่มอันแรก · ไม่สนตัวพิมพ์ใหญ่เล็ก/ช่องว่าง (เดิมเป็น dropdown ยาว เลื่อนหายาก)
// ข้อความส่งมาจากผู้เรียก (คนละ namespace i18n ระหว่างหน้าบัญชี/หน้าสมัคร)
// ─────────────────────────────────────────────────────────────
import { useId, useState } from "react";

export default function AllergySearch({
  options,
  onPick,
  placeholder,
  ariaLabel,
  noMatchText,
  disabled = false,
  inputClassName,
  className = "",
}: {
  options: string[];
  onPick: (name: string) => void;
  placeholder: string;
  ariaLabel: string;
  noMatchText: string;
  disabled?: boolean;
  inputClassName: string;
  className?: string;
}) {
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const norm = (v: string) => v.toLowerCase().replace(/\s+/g, "");
  const matches = (q.trim() ? options.filter((n) => norm(n).includes(norm(q))) : options).slice(0, 8);
  const pick = (n: string) => {
    onPick(n);
    setQ("");
  };
  return (
    <div className={`relative ${className}`}>
      <input
        type="search"
        className={inputClassName}
        value={q}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (matches[0]) pick(matches[0]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full list-none overflow-y-auto rounded-xl border border-stone-200 bg-white p-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-xs text-stone-500">{noMatchText}</li>
          ) : (
            matches.map((n) => (
              <li key={n} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(n)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-stone-800 hover:bg-[#FAF6F0]"
                >
                  {n}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
