"use client";
// ─────────────────────────────────────────────────────────────
// ช่องพิมพ์ค้นหาแล้วเลือกจากรายการ (combobox) — ใช้ฝั่งลูกค้า:
//   วัตถุดิบที่แพ้ (หน้าบัญชี + หน้าสมัครสมาชิก) · จังหวัดในที่อยู่
// - พิมพ์แล้วกรองทันที (ไม่ต้องเลื่อนหาใน dropdown ยาว ๆ) · กดรายการ / Enter = เลือกอันที่ไฮไลต์ · ↑↓ เลื่อน · Esc ปิด
// - value (ไม่บังคับ) = ค่าที่เลือกอยู่ แสดงในช่องตอนไม่ได้พิมพ์ (เช่น จังหวัด) · ไม่ส่ง = ล้างช่องหลังเลือก (เพิ่มทีละรายการ)
// - เลือกได้เฉพาะค่าในรายการ — พิมพ์แล้วออกจากช่องโดยไม่เลือก: ตรงรายการพอดี = เลือกให้ · ไม่ตรง = กลับเป็นค่าเดิม
// ─────────────────────────────────────────────────────────────
import { useId, useState } from "react";

const MAX_SHOWN = 50;

export default function SearchPicker({
  options,
  onPick,
  value,
  placeholder,
  label,
  emptyText,
  disabled = false,
  loading = false,
  invalid = false,
  inputClassName,
  id,
  onBlurField,
}: {
  options: readonly string[];
  onPick: (v: string) => void;
  value?: string;
  placeholder: string;
  label: string;
  emptyText: string;
  disabled?: boolean;
  loading?: boolean;
  /** ขอบแดง + aria-invalid */
  invalid?: boolean;
  inputClassName: string;
  id?: string;
  /** ออกจากช่อง (ใช้ทำ "แตะช่องแล้ว" ของฟอร์ม) */
  onBlurField?: () => void;
}) {
  const listId = useId();
  const [q, setQ] = useState<string | null>(null); // null = ไม่ได้พิมพ์อยู่
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const needle = (q ?? "").trim().toLowerCase();
  const matches = (needle ? options.filter((n) => n.toLowerCase().includes(needle)) : options).slice(0, MAX_SHOWN);

  const pick = (v: string) => {
    onPick(v);
    setQ(null);
    setActive(0);
    setOpen(false);
  };
  const leave = () => {
    setOpen(false);
    // พิมพ์ตรงชื่อในรายการพอดี = เลือกให้ · ไม่ตรง = กลับเป็นค่าเดิม
    const exact = q !== null ? options.find((o) => o.toLowerCase() === needle) : undefined;
    if (exact && exact !== value) onPick(exact);
    setQ(null);
    onBlurField?.();
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        className={`${inputClassName} ${invalid ? "!border-red-400" : ""}`}
        value={q ?? value ?? ""}
        disabled={disabled || loading}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={invalid || undefined}
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onBlur={() => setTimeout(leave, 120)}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (open && matches[active]) pick(matches[active]);
          } else if (e.key === "Escape") {
            setQ(null);
            setOpen(false);
          }
        }}
      />
      {open && !loading && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full list-none overflow-y-auto rounded-xl border border-stone-200 bg-white p-1 text-left shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-xs text-stone-500">{emptyText}</li>
          ) : (
            matches.map((n, i) => (
              <li key={n} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(n)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm text-stone-800 ${i === active ? "bg-[#FAF6F0]" : ""} ${
                    n === value ? "font-semibold" : ""
                  }`}
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
