"use client";
// ช่องค้นหาในหน้าประวัติการสั่งซื้อ / พรีออเดอร์ — พิมพ์แล้วรอ 350 ms ค่อยค้น (ไม่ยิง API ทุกตัวอักษร) · ปุ่ม × ล้างคำค้น
// backend ค้นทั้งเลขบิลและชื่อสินค้าในบิล (GET /shop/orders|preorders?search=)
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 350;

export default function HistorySearch({ onSearch, placeholder }: { onSearch: (q: string) => void; placeholder: string }) {
  const t = useTranslations("shop.orders");
  const [text, setText] = useState("");
  // เก็บ callback ล่าสุดไว้ใน ref — ตัวจับเวลาไม่ต้องเริ่มใหม่ตอนหน้าที่ใช้ render ใหม่ (เช่นเปลี่ยนหน้า)
  const latest = useRef(onSearch);
  useEffect(() => {
    latest.current = onSearch;
  });
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const h = setTimeout(() => latest.current(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(h);
  }, [text]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
      <input
        type="search"
        value={text}
        maxLength={100}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-[40px] w-full rounded-xl border border-stone-200 bg-white pl-9 pr-10 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#4A342E]/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText("")}
          aria-label={t("clearSearch")}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
