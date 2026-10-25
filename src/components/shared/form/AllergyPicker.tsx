"use client";
// ─────────────────────────────────────────────────────────────
// AllergyPicker — ช่องค้นหาวัตถุดิบที่แพ้ แทน <select> ที่ค้นหาไม่ได้ · ใช้ที่หน้าบัญชีลูกค้า + หน้าสมัครสมาชิก
// พิมพ์แล้วกรองทันที (ไม่สนตัวพิมพ์เล็ก-ใหญ่/วรรณยุกต์ไทย เหมือน backend allergenChecker) · ↑↓ เลือก · Enter เพิ่ม · Esc ปิด
// ARIA combobox: input role="combobox" + listbox/option
// ─────────────────────────────────────────────────────────────
import { useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { shopInput } from "@/components/customer/shopStyles";

/** วรรณยุกต์ไทย ไม้เอก–ไม้จัตวา (U+0E48–U+0E4B) */
const isThaiToneMark = (ch: string) => {
  const code = ch.charCodeAt(0);
  return code >= 0x0e48 && code <= 0x0e4b;
};

/** ทำให้ค้นหาง่าย: ตัวเล็ก · ตัดวรรณยุกต์ไทย · ตัดช่องว่างหัวท้าย */
function normalize(s: string): string {
  return [...s.toLowerCase()].filter((ch) => !isThaiToneMark(ch)).join("").trim();
}

export default function AllergyPicker({
  options,
  onPick,
  disabled = false,
  loading = false,
  label,
  placeholder,
  loadingText,
  noMatchText,
  inputClassName = shopInput,
  className = "mb-3 max-w-sm",
}: {
  /** ชื่อวัตถุดิบที่เลือกได้ (ตัดที่เลือกไปแล้วออกมาก่อน · เรียงแล้ว) */
  options: string[];
  onPick: (name: string) => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  placeholder: string;
  loadingText: string;
  noMatchText: string;
  /** class ของช่องพิมพ์ (ค่าเริ่มต้น = ช่องกรอกของหน้าร้าน) — ไอคอนค้นหาเติม pl-10 ให้เอง */
  inputClassName?: string;
  /** class ของกรอบนอก (ระยะ/ความกว้าง) */
  className?: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = normalize(query);
    return q ? options.filter((n) => normalize(n).includes(q)) : options;
  }, [options, query]);
  const activeIndex = Math.min(active, Math.max(0, matches.length - 1));
  const showList = open && !disabled;

  const pick = (name: string) => {
    onPick(name);
    setQuery("");
    setActive(0);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (matches.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      if (showList && matches[activeIndex]) {
        e.preventDefault();
        pick(matches[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <div className={`relative ${className}`}>
      <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && matches.length > 0 ? optionId(activeIndex) : undefined}
        autoComplete="off"
        className={`${inputClassName} pl-10`}
        placeholder={loading ? loadingText : placeholder}
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-full z-20 m-0 mt-1 max-h-64 list-none overflow-y-auto rounded-xl border border-[#8C5A3C]/20 bg-white p-1 shadow-lg"
        >
          {loading ? (
            <li className="px-3 py-2.5 text-sm text-stone-500">{loadingText}</li>
          ) : matches.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-stone-500">{noMatchText}</li>
          ) : (
            matches.map((name, i) => (
              <li
                key={name}
                id={optionId(i)}
                role="option"
                aria-selected={i === activeIndex}
                // mousedown + preventDefault: เลือกได้ก่อน input เสีย focus (onBlur ปิดรายการ)
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(name);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex min-h-[44px] cursor-pointer items-center rounded-lg px-3 text-sm text-[#4A342E] ${
                  i === activeIndex ? "bg-[#FFF8E7]" : ""
                }`}
              >
                {name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
