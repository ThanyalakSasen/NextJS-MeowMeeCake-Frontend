"use client";
// ชิปกรองหมวดหมู่ — อยู่ใต้ TypeTabBar บนหน้าสินค้า สองแถวนี้จึงต้องบอก "เลือกอยู่" ด้วยภาษาเดียวกัน
// (น้ำตาลทึบ + ตัวอักษรขาว) — เดิมใช้ bg-brown-50 ซึ่งจางมากจนดูไม่ออกว่าเลือกอันไหน
// จุดสีของแถบ Segmented อยู่ที่ src/theme/antdTheme.ts (components.Segmented)
import { DotIndicator } from "@/components/base";
function hashColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const palette = ["#f43f5e", "#8b5cf6", "#f59e0b", "#22c55e", "#0ea5e9", "#ec4899"];
  return palette[h % palette.length];
}
export function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-brown-800 bg-brown-800 font-medium text-white"
          : "border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      <DotIndicator color={hashColor(label)} size={7} />
      {label}
    </button>
  );
}
